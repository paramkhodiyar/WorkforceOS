import { prisma } from "../../config/database";
import { config } from "../../config/env";
import { AppError } from "../../utils/errors.util";
import { redis } from "../../config/redis";
import { LeaveService } from "../leave/leave.service";
import { LeaveType } from "@prisma/client";

export class ChatbotService {
  private static formatLocalDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  private static shiftLocalDate(date: Date, days: number) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  }

  private static parseLocalDate(dateStr: string) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  private static async callLLM(systemPrompt: string, userMessage: string): Promise<string> {
    const geminiKey = config.GEMINI_API_KEY;
    const groqKey = config.GROQ_API_KEY;

    if (geminiKey && geminiKey.trim() !== "") {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: userMessage }]
                }
              ],
              systemInstruction: {
                parts: [{ text: systemPrompt }]
              }
            })
          }
        );

        if (!response.ok) {
          console.warn(`Gemini API returned status ${response.status}. Trying fallback.`);
        } else {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        }
      } catch (err: any) {
        console.error(`Failed to fetch from Gemini: ${err.message}`);
      }
    }

    if (groqKey && groqKey.trim() !== "") {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userMessage }
            ],
            temperature: 0.2
          })
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) return text;
        } else {
          console.warn(`Groq API returned status ${response.status}.`);
        }
      } catch (err) {
        console.error("Failed to fetch from Groq:", err);
      }
    }

    return `### Voyager / Nexus Offline Mode
Hi there! The AI LLM service keys (Gemini/Groq) are currently not configured, rate-limited, or reachable. 

* **To resolve this**: Add a valid \`GEMINI_API_KEY\` or \`GROQ_API_KEY\` to your backend \`.env\` file.
* **Support Contact**: You can email **paramkhodiyar1008@gmail.com** for setup assistance.

I am still here to help guide you manually if you need general directions!`;
  }

  static async getPublicResponse(message: string): Promise<string> {
    const systemPrompt = `You are "Voyager", the quirky, smart, and friendly tour guide AI chatbot for WorkforceOS.
Your job is strictly to explain the features, capabilities, and pricing of the WorkforceOS platform.
WorkforceOS is a next-generation employee operations suite offering:
- **Attendance**: Clock in/out using WFO or WFH modes with geofencing constraints.
- **Tasks**: Scoped task boards, comment feeds, dependency settings, and blocker logs.
- **Leaves**: Leave policies, automated balance updates, and approval workflows.
- **Analytics (Ops Stats)**: Attendance late counts, task blockages, and employee metrics drill-downs.
- **System Settings**: Org features toggle, department structure, and profile change approvals.

**CRITICAL CONSTRAINTS**:
1. You are strictly forbidden from writing code (JavaScript, Python, SQL, etc.) or resolving mathematical equations.
2. You are strictly forbidden from answering off-topic questions.
3. If a user asks a question outside the scope of WorkforceOS features, you must politely decline and direct them to contact the administrator at paramkhodiyar1008@gmail.com.
4. Format all responses in clean, markdown syntax (bold, italics, bullet points, headers). Do not use code blocks. Keep responses helpful and polite.`;

    return this.callLLM(systemPrompt, message);
  }

  static async getInternalResponse(userId: string, orgId: string, message: string): Promise<string> {
    // Gather employee context data
    const [user, tasks, attendanceLogs, leaveBalances, pendingLeaves] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, designation: true, email: true, department: { select: { name: true } } }
      }),
      prisma.task.findMany({
        where: { assigneeId: userId, status: { notIn: ["CLOSED", "APPROVED"] } },
        select: { title: true, status: true, dueDate: true, priority: true }
      }),
      prisma.attendance.findMany({
        where: { userId, date: { gte: ChatbotService.shiftLocalDate(new Date(), -30) } },
        select: { date: true, status: true, workMode: true }
      }),
      prisma.leaveBalance.findMany({
        where: { userId }
      }),
      prisma.leaveRequest.findMany({
        where: { userId, status: "PENDING" },
        select: { leaveType: true, startDate: true, endDate: true, days: true }
      })
    ]);

    if (!user) throw AppError.notFound("User not found");

    const lateCount = attendanceLogs.filter(a => a.status === "LATE").length;
    const totalDays = attendanceLogs.length;
    const attendanceRate = totalDays > 0 ? ((totalDays - lateCount) / totalDays) * 100 : 100;

    const employeeContext = {
      employeeName: `${user.firstName} ${user.lastName}`,
      designation: user.designation || "Staff",
      department: user.department?.name || "Unassigned",
      activeTasks: tasks.map(t => ({ title: t.title, status: t.status, dueDate: t.dueDate, priority: t.priority })),
      attendanceStats: {
        last30DaysLogs: totalDays,
        lateDays: lateCount,
        attendanceRate: `${attendanceRate.toFixed(1)}%`
      },
      leaveBalances: leaveBalances.map(b => ({ type: b.leaveType, remaining: b.remaining, allocated: b.allocated })),
      pendingLeaveRequests: pendingLeaves.map(p => ({ type: p.leaveType, duration: p.days, start: p.startDate, end: p.endDate }))
    };

    // Load recent chat history from Redis
    const historyKey = `chatbot:history:${userId}`;
    const historyData = await redis.get(historyKey);
    let chatHistory = historyData ? JSON.parse(historyData) : [];

    // Append new user message to history
    chatHistory.push({ role: "user", text: message });
    if (chatHistory.length > 10) chatHistory.shift();

    const formattedHistory = chatHistory
      .map((h: any) => `${h.role === "user" ? "Employee" : "Nexus"}: ${h.text}`)
      .join("\n");

    const today = new Date();
    const todayDateStr = ChatbotService.formatLocalDate(today);

    const tomorrowStr = ChatbotService.formatLocalDate(ChatbotService.shiftLocalDate(today, 1));

    const dayAfterStr = ChatbotService.formatLocalDate(ChatbotService.shiftLocalDate(today, 2));

    const systemPrompt = `You are "Nexus", the quirky, smart, and efficient operations assistant AI inside the WorkforceOS employee dashboard.
Your job is strictly to help the current logged-in employee (${user.firstName} ${user.lastName}) manage their operations.

You are provided with their real-time database context:
${JSON.stringify(employeeContext, null, 2)}

Today's date is: ${todayDateStr}.
Relative date guide:
- Tomorrow is: ${tomorrowStr}
- Day after tomorrow is: ${dayAfterStr}

**OPERATIONAL FLOWS**:
1. **Leave Application Flow**:
   - If the employee says they want to apply for leave (e.g. sick leave, casual leave), identify and gather the missing fields:
     - \`leaveType\`: Must be SICK, CASUAL, or EARNED.
     - \`startDate\`: Date in YYYY-MM-DD format.
     - \`endDate\`: Date in YYYY-MM-DD format.
     - \`reason\`: A brief explanation.
   - Ask for any missing fields politely.
   - Once all details are collected, output a clear summary asking for confirmation (e.g., "Please confirm you want to apply for CASUAL leave from YYYY-MM-DD to YYYY-MM-DD. Reply CONFIRM to submit.").
   - If they reply with "confirm", "yes", or confirm the summary, you MUST output the following command tag at the very end of your response:
     [COMMAND: APPLY_LEAVE leaveType="LEAVETYPE" startDate="YYYY-MM-DD" endDate="YYYY-MM-DD" reason="REASON"]
     (Ensure LEAVETYPE is capitalized SICK, CASUAL, or EARNED)
   - Do NOT output the COMMAND tag until they confirm the summary.

**CRITICAL CONSTRAINTS**:
1. You are strictly forbidden from disclosing details of any other employee, manager, or department.
2. You are strictly forbidden from writing code or resolving mathematical equations.
3. You are strictly forbidden from answering off-topic questions.
4. If you cannot answer or solve a query, direct them to contact HR at superadmin@workforceos.com.
5. Format responses in clean markdown.

Recent conversation history:
${formattedHistory}

Nexus:`;

    let botResponse = await this.callLLM(systemPrompt, message);

    // Check if the response contains the leave command
    const commandMatch = botResponse.match(
      /\[COMMAND:\s*APPLY_LEAVE\s+leaveType="([^"]+)"\s+startDate="([^"]+)"\s+endDate="([^"]+)"\s+reason="([^"]+)"\]/
    );

    if (commandMatch) {
      const leaveType = commandMatch[1] as LeaveType;
      const startDate = ChatbotService.parseLocalDate(commandMatch[2]);
      const endDate = ChatbotService.parseLocalDate(commandMatch[3]);
      const reason = commandMatch[4];

      try {
        await LeaveService.apply(userId, orgId, {
          leaveType,
          startDate,
          endDate,
          reason
        });

        // Replace command tag with successful completion text
        botResponse = botResponse.replace(
          /\[COMMAND:.*\]/,
          `🎉 **Success!** Your leave request for **${leaveType}** leave from **${commandMatch[2]}** to **${commandMatch[3]}** has been successfully applied and sent to your manager for approval.`
        );
        // Clear history upon flow completion so they can start a new request clean
        chatHistory = [];
      } catch (err: any) {
        console.error("Failed to apply leave via chatbot command:", err);
        botResponse = botResponse.replace(
          /\[COMMAND:.*\]/,
          `⚠️ **Failed to apply leave**: ${err.message || "An unexpected error occurred."}`
        );
      }
    }

    // Save updated history
    if (chatHistory.length > 0) {
      chatHistory.push({ role: "model", text: botResponse });
      await redis.setex(historyKey, 3600, JSON.stringify(chatHistory));
    } else {
      await redis.del(historyKey);
    }

    return botResponse;
  }
}
