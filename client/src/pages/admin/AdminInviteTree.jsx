import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  ChevronRight,
  ChevronDown,
  Users,
  Crown,
  UserCircle,
  Sprout,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react';
import api from '../../api/axios';
import LoadingScreen from '../../components/LoadingScreen';

/*
  Admin Invite Tree
  =================
  The backend hands back a flat adjacency list (each user carries `invited_by`).
  We assemble it into a forest of root nodes and render it recursively.

      invited_by = NULL                 ┌─ root (organic signup)
            │                           │
            ▼                  root ────┤─ invitee
      ┌───────────┐                     │     │
      │  user.id  │◄── invited_by       │     └─ invitee's invitee …
      └───────────┘                     └─ invitee

  Roots = users with no inviter. `invited_by` is a self-FK with
  ON DELETE SET NULL, so there are no dangling parents — a NULL parent (or, as a
  defensive fallback, a parent id not present in the set) makes the node a root.

  MONEY (later): each node has a clearly-marked slot where per-invite earnings
  will render once the invite payout concept lands. Search for "MONEY:" below.
*/

// Build { roots, byId } from the flat list. Each node gets a `children` array.
function buildForest(users) {
  const byId = new Map();
  users.forEach((u) => byId.set(u.id, { ...u, children: [] }));

  const roots = [];
  byId.forEach((node) => {
    const parent = node.invited_by != null ? byId.get(node.invited_by) : null;
    // Guard against a self-reference (parent === node) which would orphan it.
    if (parent && parent.id !== node.id) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return { roots, byId };
}

// Total descendants under a node (whole subtree, not just direct invitees).
function subtreeCount(node) {
  let n = 0;
  for (const child of node.children) n += 1 + subtreeCount(child);
  return n;
}

// Deepest chain length starting at this node (1 = the node alone).
function maxDepth(node) {
  if (node.children.length === 0) return 1;
  return 1 + Math.max(...node.children.map(maxDepth));
}

const norm = (s) => (s || '').toLowerCase();

// When searching, compute the set of node ids to show: every match, plus its
// ancestor path (so you see WHERE it sits) and its whole subtree (so you can
// explore down from it). Returns null when the term is empty (= show all).
function computeVisible(users, term) {
  const lc = term.trim().toLowerCase();
  if (!lc) return null;

  const byId = new Map(users.map((u) => [u.id, u]));
  const childrenMap = new Map();
  users.forEach((u) => {
    if (u.invited_by != null) {
      if (!childrenMap.has(u.invited_by)) childrenMap.set(u.invited_by, []);
      childrenMap.get(u.invited_by).push(u.id);
    }
  });

  const matchIds = new Set(
    users
      .filter(
        (u) =>
          norm(u.full_name).includes(lc) ||
          norm(u.email).includes(lc) ||
          norm(u.invite_code).includes(lc)
      )
      .map((u) => u.id)
  );

  const visible = new Set();

  // Ancestor path of every match.
  matchIds.forEach((id) => {
    let cur = byId.get(id);
    while (cur) {
      visible.add(cur.id);
      cur = cur.invited_by != null ? byId.get(cur.invited_by) : null;
    }
  });

  // Subtree of every match.
  const stack = [...matchIds];
  while (stack.length) {
    const id = stack.pop();
    visible.add(id);
    (childrenMap.get(id) || []).forEach((cid) => {
      if (!visible.has(cid)) stack.push(cid);
    });
  }

  return { visible, matchIds };
}

const AdminInviteTree = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  // Ids that are collapsed. Default empty => everything expanded (good for a
  // small tree). Searching force-expands regardless of this set.
  const [collapsed, setCollapsed] = useState(() => new Set());

  const fetchTree = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/api/admin/invite-tree');
      setUsers(res.data?.users || []);
    } catch (err) {
      console.error('Failed to load invite tree', err);
      setError('Could not load the invite tree. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const { roots } = useMemo(() => buildForest(users), [users]);

  const searchResult = useMemo(() => computeVisible(users, search), [users, search]);
  const visibleIds = searchResult?.visible ?? null;
  const matchIds = searchResult?.matchIds ?? null;
  const searching = visibleIds != null;

  const summary = useMemo(() => {
    const total = users.length;
    const organic = roots.length; // signed up without an invite
    const invited = total - organic;
    const deepest = roots.length ? Math.max(...roots.map(maxDepth)) : 0;
    return { total, organic, invited, deepest };
  }, [users, roots]);

  const toggle = useCallback((id) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => {
    // Collapse every node. Collapsing a leaf is a no-op (it has no expander),
    // so collapsing all ids is the simplest correct way to fold the whole tree.
    setCollapsed(new Set(users.map((u) => u.id)));
  }, [users]);

  const expandAll = useCallback(() => setCollapsed(new Set()), []);

  if (loading) return <LoadingScreen />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-black uppercase tracking-[0.25em] text-[#FBDB8C] flex items-center gap-2">
          <Users size={18} /> Invite Tree
        </h2>
        <p className="text-white/40 text-xs mt-1">
          Who invited whom across the whole community. Roots are organic signups.
        </p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryTile label="Devotees" value={summary.total} Icon={Users} />
        <SummaryTile label="Organic (roots)" value={summary.organic} Icon={Sprout} />
        <SummaryTile label="Invited in" value={summary.invited} Icon={UserCircle} />
        <SummaryTile label="Deepest chain" value={summary.deepest} Icon={ChevronsUpDown} />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or invite code…"
            className="w-full bg-white/5 border border-[#FBDB8C]/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#FBDB8C]/40"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={expandAll}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 bg-white/5 border border-white/10 hover:text-[#FBDB8C] hover:border-[#FBDB8C]/30 transition-all"
          >
            <ChevronsUpDown size={14} /> Expand
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 bg-white/5 border border-white/10 hover:text-[#FBDB8C] hover:border-[#FBDB8C]/30 transition-all"
          >
            <ChevronsDownUp size={14} /> Collapse
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* Tree */}
      <div className="bg-white/[0.02] border border-[#FBDB8C]/10 rounded-2xl p-3 sm:p-5">
        {roots.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-10">No devotees yet.</p>
        ) : searching && visibleIds.size === 0 ? (
          <p className="text-white/40 text-sm text-center py-10">
            No devotees match “{search}”.
          </p>
        ) : (
          <ul className="space-y-1">
            {roots
              .filter((node) => !searching || visibleIds.has(node.id))
              .map((node) => (
                <TreeNode
                  key={node.id}
                  node={node}
                  depth={0}
                  collapsed={collapsed}
                  toggle={toggle}
                  visibleIds={visibleIds}
                  matchIds={matchIds}
                  searching={searching}
                />
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// eslint-disable-next-line no-unused-vars
const SummaryTile = ({ label, value, Icon }) => (
  <div className="bg-white/[0.03] border border-[#FBDB8C]/10 rounded-2xl p-4 flex items-center justify-between">
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">{label}</p>
      <p className="text-2xl font-black text-[#FBDB8C] mt-1">{value}</p>
    </div>
    <Icon size={22} className="text-[#FBDB8C]/40" />
  </div>
);

// Recursive node row. Indentation encodes depth; a left border draws the
// connector line down each branch.
const TreeNode = ({ node, depth, collapsed, toggle, visibleIds, matchIds, searching }) => {
  const hasChildren = node.children.length > 0;
  // While searching, force-expand so matches deep in the tree are reachable.
  const isOpen = searching ? true : !collapsed.has(node.id);
  const isMatch = matchIds?.has(node.id);
  const directInvites = node.children.length;
  const totalInvites = subtreeCount(node);

  const visibleChildren = node.children.filter(
    (c) => !searching || visibleIds.has(c.id)
  );

  return (
    <li>
      <div
        className={`group flex items-center gap-2 rounded-xl px-2.5 py-2 transition-colors ${
          isMatch ? 'bg-[#FBDB8C]/10 ring-1 ring-[#FBDB8C]/30' : 'hover:bg-white/5'
        }`}
        style={{ marginLeft: depth * 18 }}
      >
        {/* Expander */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => toggle(node.id)}
            className="text-white/40 hover:text-[#FBDB8C] shrink-0"
            aria-label={isOpen ? 'Collapse' : 'Expand'}
            disabled={searching}
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white truncate">
              {node.full_name || 'Unnamed'}
            </span>
            {node.role === 'ADMIN' && (
              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/10 border border-amber-400/20 rounded px-1.5 py-0.5">
                <Crown size={10} /> Admin
              </span>
            )}
            {node.invite_code && (
              <span className="text-[10px] font-mono text-[#FBDB8C]/70 bg-[#FBDB8C]/5 border border-[#FBDB8C]/10 rounded px-1.5 py-0.5">
                {node.invite_code}
              </span>
            )}
          </div>
          <p className="text-[11px] text-white/30 truncate">{node.email}</p>
        </div>

        {/* Invite counts (direct vs whole subtree) */}
        <div className="shrink-0 text-right">
          <p className="text-[11px] font-bold text-[#FBDB8C]">
            {directInvites} direct
          </p>
          {totalInvites !== directInvites && (
            <p className="text-[10px] text-white/30">{totalInvites} in network</p>
          )}
        </div>

        {/* MONEY: per-invite earnings badge will render here once the invite
            payout concept lands (e.g. <span>₹{node.invite_earnings}</span>).
            Backend would add the field to /api/admin/invite-tree; no structural
            change needed here. */}
      </div>

      {hasChildren && isOpen && visibleChildren.length > 0 && (
        <ul className="mt-1 space-y-1 border-l border-[#FBDB8C]/10" style={{ marginLeft: depth * 18 + 7 }}>
          {visibleChildren.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              collapsed={collapsed}
              toggle={toggle}
              visibleIds={visibleIds}
              matchIds={matchIds}
              searching={searching}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default AdminInviteTree;
