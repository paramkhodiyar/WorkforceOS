import { prisma } from "../../config/database";
import { config } from "../../config/env";
import { AppError } from "../../utils/errors.util";

export class ChatbotService {
  private static async callLLM(systemPrompt: string, userMessage: string): Promise<string> {
    const geminiKey = config.GEMINI_API_KEY;
    const groqKey = config.GROQ_API_KEY;

    if (geminiKey && geminiKey.trim() !== "") {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
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
          const errText = await response.text();
          console.error("Gemini API error response:", errText);
          throw new Error(`Gemini API returned status ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } catch (err) {
        console.error("Failed to fetch from Gemini:", err);
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

        if (!response.ok) {
          const errText = await response.text();
          console.error("Groq API error response:", errText);
          throw new Error(`Groq API returned status ${response.status}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return text;
      } catch (err) {
        console.error("Failed to fetch from Groq:", err);
      }
    }

    // Fallback if APIs are not configured or failed
    return `### Voyager / Nexus Offline Mode
Hi there! The AI LLM service keys (Gemini/Groq) are currently not configured or reachable. 

* **To resolve this**: Add \`GEMINI_API_KEY\` or \`GROQ_API_KEY\` to your backend \`.env\` file.
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
        where: { userId, date: { gte: new Date(new Date().setDate(new Date().getDate() - 30)) } },
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

    const systemPrompt = `You are "Nexus", the quirky, smart, and efficient operations assistant AI inside the WorkforceOS employee dashboard.
Your job is strictly to help the current logged-in employee (${user.firstName} ${user.lastName}) manage their operations.

You are provided with their real-time database context:
${JSON.stringify(employeeContext, null, 2)}

**OPERATIONAL CAPABILITIES**:
1. You can list or summarize their active tasks, priorities, and upcoming deadlines.
2. You can check and report their remaining leave balances or pending requests.
3. You can provide their 30-day attendance stats, rates, and late counts.
4. You can explain how to apply for leave (tell them to navigate to the Leave tab and click "Apply Leave") or how to check in (tell them to click "Check In" on the Dashboard).

**CRITICAL CONSTRAINTS**:
1. You are strictly forbidden from disclosing details of any other employee, manager, or department.
2. You are strictly forbidden from writing code or resolving mathematical equations.
3. You are strictly forbidden from answering off-topic questions.
4. If they ask to perform an action you cannot do directly (e.g. approve a leave, delete a task), explain the manual steps (e.g. "To apply for leave, click on 'Leave' in the sidebar and press 'Apply Leave'") or politely direct them to contact HR. If you cannot answer or solve a query, direct them to contact HR at superadmin@workforceos.com.
5. Format all responses in clean, markdown syntax (bold, italics, bullet points, headers). Keep responses polite, helpful, and concise.`;

    return this.callLLM(systemPrompt, message);
  }
}
