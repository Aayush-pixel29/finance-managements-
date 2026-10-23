import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import {
  X,
  LogOut,
  Folder,
  Check,
  Sparkles,
  Users,
  ChevronRight,
  Trash2,
  Crown
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose, onSelectUser, onCreateGroupClick }) {
  const { currentUser, userProfile, logout } = useAuth();
  const { userGroups, currentGroupId, setCurrentGroupId, groupMembers, addMember, removeMember, deleteGroup } = useGroup();

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  if (!isOpen) return null;

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await addMember(inviteEmail.trim().toLowerCase());
      setInviteEmail('');
      setShowInvite(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add member to group.");
    } finally {
      setInviting(false);
    }
  };

  const handleLeaveGroup = async (groupId, groupName) => {
    if (window.confirm(`Are you sure you want to leave ${groupName}?`)) {
      try {
        await removeMember(groupId, currentUser);
      } catch (err) {
        console.error(err);
        alert("Failed to leave group.");
      }
    }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (window.confirm(`⚠️ Permanently DELETE group "${groupName}"?\n\nThis will remove the group for all members and cannot be undone.`)) {
      try {
        await deleteGroup(groupId);
      } catch (err) {
        console.error(err);
        alert("Failed to delete group.");
      }
    }
  };

  return (
    <>
      <div className="yc-modal-backdrop" onClick={onClose} style={{ zIndex: 90 }}></div>

      <div className="yc-drawer">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--yc-gradient)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
              <Sparkles size={18} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900 }}>FinanceHub</h3>
          </div>
          <button onClick={onClose} className="btn-yc-icon" style={{ width: '36px', height: '36px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Current User Card */}
        <div
          onClick={() => { onSelectUser(currentUser); onClose(); }}
          className="yc-card yc-card-glow"
          style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', cursor: 'pointer' }}
        >
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--yc-gradient)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
            {currentUser.slice(0, 2).toUpperCase()}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ fontWeight: 800, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {userProfile?.displayName || currentUser.split('@')[0]}
            </p>
            <p className="text-subtle" style={{ fontSize: '0.72rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {currentUser}
            </p>
          </div>
          <ChevronRight size={16} color="var(--text-subtle)" />
        </div>

        {/* Scrollable Groups & Members */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Groups Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span className="input-caption" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Folder size={12} /> My Groups ({userGroups.length})
              </span>
              <button
                onClick={() => { onCreateGroupClick(); onClose(); }}
                style={{ background: 'none', border: 'none', color: 'var(--yc-orange)', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
              >
                + New
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {userGroups.map((group) => {
                const isActive = group.id === currentGroupId;
                const isCreator = (group.createdBy || '').toLowerCase() === (currentUser || '').toLowerCase();

                return (
                  <div key={group.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => { setCurrentGroupId(group.id); onClose(); }}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: '12px',
                        border: `1.5px solid ${isActive ? 'var(--yc-orange)' : 'var(--border-subtle)'}`,
                        background: isActive ? 'var(--yc-orange-light)' : 'var(--bg-input)',
                        color: isActive ? 'var(--yc-orange)' : 'var(--text-muted)',
                        fontSize: '0.88rem',
                        fontWeight: isActive ? 800 : 500,
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</span>
                        {isCreator && (
                          <span title="You created this group" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--yc-orange)', opacity: 0.8 }}>
                            <Crown size={12} />
                          </span>
                        )}
                      </div>
                      {isActive && <Check size={16} />}
                    </button>

                    {/* Delete button for Group Creator */}
                    {isCreator && (
                      <button
                        onClick={() => handleDeleteGroup(group.id, group.name)}
                        className="btn-yc-icon"
                        style={{ width: '38px', height: '38px', color: 'var(--coral-red)', flexShrink: 0 }}
                        title="Delete Group (Admin)"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}

                    {/* Leave button for non-creators */}
                    {!isCreator && userGroups.length > 1 && (
                      <button
                        onClick={() => handleLeaveGroup(group.id, group.name)}
                        className="btn-yc-icon"
                        style={{ width: '38px', height: '38px', color: 'var(--coral-red)', flexShrink: 0 }}
                        title="Leave Group"
                      >
                        <LogOut size={15} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group Members Section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span className="input-caption" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={12} /> Members ({groupMembers.length})
              </span>
              <button
                onClick={() => setShowInvite(!showInvite)}
                style={{ background: 'none', border: 'none', color: 'var(--yc-orange)', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
              >
                {showInvite ? 'Cancel' : '+ Add Member'}
              </button>
            </div>

            {showInvite && (
              <form onSubmit={handleInvite} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="email"
                    className="input-yc"
                    placeholder="family@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    style={{ flex: 1, height: '38px', padding: '6px 12px', fontSize: '0.85rem' }}
                    required
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="btn-yc-primary"
                    disabled={inviting}
                    style={{ width: 'auto', padding: '6px 14px', fontSize: '0.85rem', height: '38px', minHeight: '38px' }}
                  >
                    Add
                  </button>
                </div>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {groupMembers.map((memberEmail) => {
                const isMe = memberEmail === currentUser;
                return (
                  <div
                    key={memberEmail}
                    onClick={() => { onSelectUser(memberEmail); onClose(); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,102,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--yc-orange)' }}>
                      {memberEmail.slice(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.85rem', color: isMe ? '#FFFFFF' : 'var(--text-muted)', fontWeight: isMe ? 700 : 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {isMe ? 'You' : memberEmail.split('@')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Sign Out Action */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '16px' }}>
          <button
            onClick={logout}
            className="btn-yc-secondary"
            style={{ width: '100%', color: 'var(--coral-red)', borderColor: 'rgba(239,68,68,0.3)', background: 'var(--coral-bg)' }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

      </div>
    </>
  );
}
