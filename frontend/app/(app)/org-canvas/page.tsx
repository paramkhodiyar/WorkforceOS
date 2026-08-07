'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
  useReactFlow,
  ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

import { useAuth } from '../../../lib/auth/AuthProvider';
import { api } from '../../../lib/api/client';
import { useToast } from '../../../lib/toast/ToastProvider';
import LogoLoader from '../../../components/ui/LogoLoader';
import { EmployeeNode } from '../../../components/org-canvas/EmployeeNode';
import { DepartmentNode } from '../../../components/org-canvas/DepartmentNode';
import { TeamNode } from '../../../components/org-canvas/TeamNode';
import { OrgCanvasSearch } from '../../../components/org-canvas/OrgCanvasSearch';
import { OrgCanvasSidePanel } from '../../../components/org-canvas/OrgCanvasSidePanel';
import { RoleManagementModal } from '../../../components/org-canvas/RoleManagementModal';

const nodeTypes = {
  employee: EmployeeNode,
  department: DepartmentNode,
  team: TeamNode
};

const ORG_CANVAS_AUTO_EXPAND_LIMIT = 40;

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: 'TB', nodesep: 45, ranksep: 75 });

  nodes.forEach((node) => {
    const width = node.type === 'department' ? 300 : node.type === 'team' ? 280 : 260;
    const height = node.type === 'department' ? 120 : node.type === 'team' ? 90 : 100;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition ? nodeWithPosition.x - 130 : 0,
        y: nodeWithPosition ? nodeWithPosition.y - 50 : 0
      }
    };
  });

  return { nodes: layoutedNodes, edges };
}

function OrgCanvasFlow() {
  const { user, features, hasPermission } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { setCenter, fitView } = useReactFlow();

  const [isDesktop, setIsDesktop] = useState(true);
  const [loading, setLoading] = useState(true);
  const [treeData, setTreeData] = useState<any>(null);
  const [allRoles, setAllRoles] = useState<any[]>([]);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const [collapsedBuckets, setCollapsedBuckets] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<{ type: 'employee' | 'department' | 'team'; node: any } | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  // Drag & drop inline confirmation state
  const [pendingDragAction, setPendingDragAction] = useState<{
    type: 'reassign_manager' | 'reassign_department';
    sourceNode: any;
    targetNode: any;
  } | null>(null);
  const [mutating, setMutating] = useState(false);

  // Responsive desktop-only check
  useEffect(() => {
    function checkViewport() {
      if (typeof window !== 'undefined') {
        setIsDesktop(window.innerWidth >= 1024);
      }
    }
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Access control & feature flag guard
  const activeFeatures = features && features.length > 0 ? features : [
    'employees', 'attendance', 'leave', 'tasks', 'performance', 'payroll', 'expenses', 'assets', 'knowledge', 'calendar', 'org-canvas'
  ];
  const isFeatureEnabled = activeFeatures.includes('org-canvas');

  const systemRole = user?.systemRole;
  const userRoles = user?.roles || [];
  const isHR = userRoles.some((r: any) => r.roleName === 'HR_MANAGER') || systemRole === 'HR';
  const isAdmin = systemRole === 'SUPER_ADMIN' || systemRole === 'ORG_ADMIN' || user?.originalRole === 'SYS_OWNER';
  const isAuthorized = isAdmin || isHR || hasPermission('employee', 'read');

  useEffect(() => {
    if (!user) return;
    if (!isAuthorized) {
      router.push('/unauthorized');
    }
  }, [user, isAuthorized, router]);

  const loadCanvasData = useCallback(async () => {
    try {
      setLoading(true);
      const [treeRes, rolesRes] = await Promise.all([
        api.orgCanvas.getTree(),
        api.orgCanvas.getRoles().catch(() => ({ data: [] }))
      ]);

      const data = treeRes.data;
      setTreeData(data);
      setAllRoles(rolesRes.data || []);

      // Auto collapse if total employees > threshold
      if (data.stats.totalEmployees > ORG_CANVAS_AUTO_EXPAND_LIMIT) {
        const teamIds = new Set<string>(data.teams.map((t: any) => t.id));
        setCollapsedBuckets(teamIds);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to load Org Canvas tree data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isAuthorized && isFeatureEnabled) {
      loadCanvasData();
    }
  }, [isAuthorized, isFeatureEnabled, loadCanvasData]);

  // Handle Node Select
  const handleSelectNode = useCallback(
    (id: string, type: 'employee' | 'department' | 'team') => {
      if (!treeData) return;
      if (type === 'employee') {
        const emp = treeData.employees.find((e: any) => e.id === id);
        if (emp) setSelectedNode({ type: 'employee', node: emp });
      } else if (type === 'department') {
        const dept = treeData.departments.find((d: any) => d.id === id);
        if (dept) setSelectedNode({ type: 'department', node: dept });
      } else if (type === 'team') {
        const team = treeData.teams.find((t: any) => t.id === id);
        if (team) setSelectedNode({ type: 'team', node: team });
      }
    },
    [treeData]
  );

  const handleToggleExpandBucket = useCallback((bucketId: string) => {
    setCollapsedBuckets((prev) => {
      const next = new Set<string>(prev);
      if (next.has(bucketId)) {
        next.delete(bucketId);
      } else {
        next.add(bucketId);
      }
      return next;
    });
  }, []);

  // Build React Flow graph elements
  useEffect(() => {
    if (!treeData) return;

    const rawNodes: Node[] = [];
    const rawEdges: Edge[] = [];

    // Add Department Nodes
    treeData.departments.forEach((dept: any) => {
      rawNodes.push({
        id: `dept-${dept.id}`,
        type: 'department',
        position: { x: 0, y: 0 },
        data: {
          id: dept.id,
          name: dept.name,
          head: dept.head,
          userCount: dept.userCount,
          teamCount: dept.teamCount,
          isCollapsed: collapsedBuckets.has(dept.id),
          onToggleExpand: handleToggleExpandBucket,
          onSelectNode: handleSelectNode
        }
      });
    });

    // Add Team Nodes
    treeData.teams.forEach((team: any) => {
      const isDeptCollapsed = collapsedBuckets.has(team.departmentId);
      if (!isDeptCollapsed) {
        rawNodes.push({
          id: `team-${team.id}`,
          type: 'team',
          position: { x: 0, y: 0 },
          data: {
            id: team.id,
            name: team.name,
            departmentName: team.departmentName,
            lead: team.lead,
            memberCount: team.memberCount,
            isCollapsed: collapsedBuckets.has(team.id),
            onToggleExpand: handleToggleExpandBucket,
            onSelectNode: handleSelectNode
          }
        });

        // Edge from department to team
        rawEdges.push({
          id: `e-dept-${team.departmentId}-team-${team.id}`,
          source: `dept-${team.departmentId}`,
          target: `team-${team.id}`,
          style: { stroke: '#94a3b8', strokeWidth: 1.5 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
        });
      }
    });

    // Add Employee Nodes
    const rootSet = new Set(treeData.roots);
    treeData.employees.forEach((emp: any) => {
      const isDeptCollapsed = emp.departmentId && collapsedBuckets.has(emp.departmentId);
      const isTeamCollapsed = emp.teams.some((t: any) => collapsedBuckets.has(t.id));

      if (!isDeptCollapsed && !isTeamCollapsed) {
        const isRoot = rootSet.has(emp.id);
        const isHighlighted = emp.id === highlightedNodeId;

        rawNodes.push({
          id: `emp-${emp.id}`,
          type: 'employee',
          position: { x: 0, y: 0 },
          data: {
            id: emp.id,
            name: emp.name,
            designation: emp.designation,
            avatarUrl: emp.avatarUrl,
            status: emp.status,
            departmentId: emp.departmentId,
            departmentName: emp.departmentName,
            roles: emp.roles,
            isOnLeaveToday: emp.isOnLeaveToday,
            isRoot,
            isHighlighted,
            isDimmed: highlightedNodeId ? emp.id !== highlightedNodeId : false,
            isDeleted: emp.isDeleted,
            onSelectNode: handleSelectNode
          }
        });

        // Connector line based on managerId
        if (emp.managerId) {
          rawEdges.push({
            id: `e-emp-${emp.managerId}-emp-${emp.id}`,
            source: `emp-${emp.managerId}`,
            target: `emp-${emp.id}`,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' }
          });
        }
      }
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges);
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [treeData, collapsedBuckets, highlightedNodeId, handleSelectNode, handleToggleExpandBucket, setNodes, setEdges]);

  // Focus & center search result
  const handleFocusSearchResult = useCallback(
    (result: { id: string; type: 'employee' | 'department' | 'team' }) => {
      if (!treeData) return;

      if (result.type === 'employee') {
        const emp = treeData.employees.find((e: any) => e.id === result.id);
        if (emp) {
          // Uncollapse department and team buckets if needed
          if (emp.departmentId) {
            setCollapsedBuckets((prev) => {
              const next = new Set<string>(prev);
              next.delete(emp.departmentId);
              emp.teams?.forEach((t: any) => next.delete(t.id));
              return next;
            });
          }

          setHighlightedNodeId(emp.id);
          setSelectedNode({ type: 'employee', node: emp });

          const targetNode = nodes.find((n) => n.id === `emp-${emp.id}`);
          if (targetNode) {
            setCenter(targetNode.position.x + 130, targetNode.position.y + 50, { zoom: 1.1, duration: 800 });
          }
        }
      } else if (result.type === 'department') {
        const dept = treeData.departments.find((d: any) => d.id === result.id);
        if (dept) {
          setCollapsedBuckets((prev) => {
            const next = new Set<string>(prev);
            next.delete(dept.id);
            return next;
          });
          setSelectedNode({ type: 'department', node: dept });
          const targetNode = nodes.find((n) => n.id === `dept-${dept.id}`);
          if (targetNode) {
            setCenter(targetNode.position.x + 150, targetNode.position.y + 60, { zoom: 1.1, duration: 800 });
          }
        }
      } else if (result.type === 'team') {
        const team = treeData.teams.find((t: any) => t.id === result.id);
        if (team) {
          setCollapsedBuckets((prev) => {
            const next = new Set<string>(prev);
            next.delete(team.departmentId);
            next.delete(team.id);
            return next;
          });
          setSelectedNode({ type: 'team', node: team });
          const targetNode = nodes.find((n) => n.id === `team-${team.id}`);
          if (targetNode) {
            setCenter(targetNode.position.x + 140, targetNode.position.y + 45, { zoom: 1.1, duration: 800 });
          }
        }
      }

      // Auto reset highlight after 3 seconds
      setTimeout(() => setHighlightedNodeId(null), 3000);
    },
    [treeData, nodes, setCenter]
  );

  // Handle Drag & Drop Node Reassignments
  const handleNodeDragStop = useCallback(
    (event: any, node: Node) => {
      if (!isAdmin && !isHR) return;
      if (!node.id.startsWith('emp-')) return;

      const draggedEmpId = node.id.replace('emp-', '');
      const draggedEmp = treeData?.employees?.find((e: any) => e.id === draggedEmpId);
      if (!draggedEmp) return;

      // Find drop target under cursor position
      const clientX = event.clientX;
      const clientY = event.clientY;

      const elem = document.elementFromPoint(clientX, clientY);
      const targetCard = elem?.closest('[data-id]') as HTMLElement;
      if (!targetCard) return;

      const targetId = targetCard.getAttribute('data-id');
      if (!targetId || targetId === node.id) return;

      if (targetId.startsWith('emp-')) {
        const targetEmpId = targetId.replace('emp-', '');
        const targetEmp = treeData?.employees?.find((e: any) => e.id === targetEmpId);
        if (targetEmp && targetEmp.id !== draggedEmp.managerId) {
          setPendingDragAction({
            type: 'reassign_manager',
            sourceNode: draggedEmp,
            targetNode: targetEmp
          });
        }
      } else if (targetId.startsWith('dept-')) {
        const targetDeptId = targetId.replace('dept-', '');
        const targetDept = treeData?.departments?.find((d: any) => d.id === targetDeptId);
        if (targetDept && targetDept.id !== draggedEmp.departmentId) {
          setPendingDragAction({
            type: 'reassign_department',
            sourceNode: draggedEmp,
            targetNode: targetDept
          });
        }
      }
    },
    [isAdmin, isHR, treeData]
  );

  // Execute confirmed drag mutation
  async function confirmPendingDragAction() {
    if (!pendingDragAction) return;
    const { type, sourceNode, targetNode } = pendingDragAction;

    try {
      setMutating(true);
      if (type === 'reassign_manager') {
        await api.orgCanvas.reassignManager({
          userId: sourceNode.id,
          newManagerId: targetNode.id
        });
        toast.success(`Reassigned ${sourceNode.name} to report to ${targetNode.name}`);
      } else if (type === 'reassign_department') {
        await api.orgCanvas.reassignDepartment({
          userId: sourceNode.id,
          newDepartmentId: targetNode.id
        });
        toast.success(`Moved ${sourceNode.name} to ${targetNode.name} Department`);
      }
      await loadCanvasData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update reporting structure');
    } finally {
      setMutating(false);
      setPendingDragAction(null);
    }
  }

  // Mobile Shield Guard
  if (!isDesktop) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-md space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600">
            <span className="material-symbols-outlined text-[28px]">desktop_windows</span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            Laptop or Desktop Required
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The interactive Org Canvas features an expansive workforce hierarchy, node drag-and-drop management, and dynamic access matrices designed specifically for larger desktop viewports.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <LogoLoader text="Loading..." />
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full bg-slate-50 overflow-hidden select-none">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          <OrgCanvasSearch onSelectResult={handleFocusSearchResult} />
          {treeData?.stats && (
            <div className="hidden xl:flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
              <span>{treeData.stats.totalEmployees} Employees</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span>{treeData.stats.totalDepartments} Departments</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span className="text-emerald-700">{treeData.stats.activeCount} Active</span>
            </div>
          )}
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setIsRoleModalOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-blue-600">
                admin_panel_settings
              </span>
              Manage Roles & Access
            </button>
          )}

          <button
            onClick={() => fitView({ duration: 600 })}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Auto Fit
          </button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        fitView
        minZoom={0.2}
        maxZoom={1.5}
        defaultEdgeOptions={{ style: { strokeWidth: 2, stroke: '#94a3b8' } }}
        className="bg-slate-50"
      >
        <Background color="#cbd5e1" gap={24} size={1} />
        <Controls className="!bg-white !border !border-slate-200 !rounded-xl !shadow-none !m-4" />
      </ReactFlow>

      {/* Sliding Side Panel */}
      <OrgCanvasSidePanel
        selectedNode={selectedNode}
        allRoles={allRoles}
        onClose={() => setSelectedNode(null)}
        onFocusNode={(id) => handleFocusSearchResult({ id, type: 'employee' })}
        onRefreshData={loadCanvasData}
      />

      {/* Dynamic Role & Permission Management Modal */}
      <RoleManagementModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onRolesUpdated={loadCanvasData}
      />

      {/* Drag & Drop Confirmation Modal */}
      {pendingDragAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-sm w-full space-y-4 animate-slide-in-up">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Confirm Hierarchy Change
            </h3>
            <p className="text-xs text-slate-600 leading-normal">
              {pendingDragAction.type === 'reassign_manager' ? (
                <>
                  Are you sure you want to reassign <strong>{pendingDragAction.sourceNode.name}</strong> to report directly to <strong>{pendingDragAction.targetNode.name}</strong>?
                </>
              ) : (
                <>
                  Are you sure you want to move <strong>{pendingDragAction.sourceNode.name}</strong> into the <strong>{pendingDragAction.targetNode.name}</strong> department?
                </>
              )}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setPendingDragAction(null)}
                disabled={mutating}
                className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmPendingDragAction}
                disabled={mutating}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold cursor-pointer disabled:opacity-50"
              >
                {mutating ? 'Committing...' : 'Confirm Reassignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrgCanvasPage() {
  return (
    <ReactFlowProvider>
      <OrgCanvasFlow />
    </ReactFlowProvider>
  );
}
