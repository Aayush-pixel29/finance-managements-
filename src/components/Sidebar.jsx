import React from 'react';
import { X, User, LogOut, Plus, Folder } from 'lucide-react';

export default function Sidebar({ 
  isOpen, onClose, familyMembers, currentUser, onSelectUser, onLogout,
  userGroups = [], currentGroupId, onSelectGroup, onCreateGroupClick
}) {
  if (!isOpen) return null;

  return (
    <>
      <div className="sidebar-overlay" onClick={onClose}></div>
      <div className="sidebar-drawer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="text-xl font-bold">Menu</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {/* --- GROUPS SECTION --- */}
        <div style={{ marginBottom: '32px' }}>
          <h3 className="text-sm font-bold text-muted mb-2 flex items-center gap-1"><Folder size={14} /> My Groups</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {userGroups.map((group) => (
              <button 
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className="btn"
                style={{ 
                  background: group.id === currentGroupId ? 'var(--primary)' : 'var(--card-bg)', 
                  color: group.id === currentGroupId ? 'white' : 'var(--text)',
                  border: group.id === currentGroupId ? 'none' : '1px solid var(--border)',
                  justifyContent: 'flex-start',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  fontSize: '0.9rem'
                }}
              >
                {group.name}
              </button>
            ))}
            
            <button 
              onClick={onCreateGroupClick}
              className="btn"
              style={{ 
                background: 'transparent',
                color: 'var(--primary)',
                border: '1px dashed var(--primary)',
                justifyContent: 'center',
                padding: '10px 16px',
                borderRadius: '12px',
                fontSize: '0.9rem'
              }}
            >
              <Plus size={16} /> Create Group
            </button>
          </div>
        </div>


        {/* --- MEMBERS SECTION --- */}
        <h3 className="text-sm font-bold text-muted mb-2 flex items-center gap-1"><User size={14} /> Group Members</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
          {familyMembers.map((email) => {
            const isMe = email === currentUser;
            const displayName = isMe ? "You" : email.split('@')[0];

            return (
              <button 
                key={email}
                onClick={() => {
                  onSelectUser(email);
                  onClose();
                }}
                className="btn"
                style={{ 
                  background: isMe ? 'rgba(37, 99, 235, 0.1)' : 'var(--card-bg)', 
                  color: isMe ? 'var(--primary)' : 'var(--text)',
                  border: `1px solid ${isMe ? 'var(--primary)' : 'var(--border)'}`,
                  justifyContent: 'flex-start',
                  padding: '12px 16px',
                  fontSize: '0.9rem'
                }}
              >
                <span>{displayName} {isMe && <span style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>(Me)</span>}</span>
              </button>
            );
          })}
        </div>

        <button 
          onClick={onLogout}
          className="btn btn-danger"
          style={{ marginTop: '24px', justifyContent: 'center' }}
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </>
  );
}
