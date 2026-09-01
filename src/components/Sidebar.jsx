import React, { useState } from 'react';
import { X, User, LogOut, Plus, Folder, UserPlus, Settings, Key } from 'lucide-react';
import { addMemberToGroup } from '../services/groupService';
import { getApiKey, setApiKey } from '../services/aiService';

export default function Sidebar({ 
  isOpen, onClose, familyMembers, currentUser, onSelectUser, onLogout,
  userGroups = [], currentGroupId, onSelectGroup, onCreateGroupClick
}) {
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(getApiKey() || '');

  if (!isOpen) return null;

  const handleInvite = async () => {
    if (!inviteEmail || !currentGroupId) return;
    setInviting(true);
    try {
      await addMemberToGroup(currentGroupId, inviteEmail);
      setInviteEmail('');
      setShowInvite(false);
    } catch (e) {
      console.error(e);
      alert("Failed to invite member");
    }
    setInviting(false);
  };

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
              <div key={group.id} style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => onSelectGroup(group.id)}
                  className="btn"
                  style={{ 
                    flex: 1,
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
                <button
                  onClick={async () => {
                    if (window.confirm(`Are you sure you want to leave ${group.name}?`)) {
                      try {
                        const { removeMemberFromGroup } = await import('../services/groupService');
                        await removeMemberFromGroup(group.id, currentUser);
                        // If they left the current group, switch to another one
                        if (group.id === currentGroupId && userGroups.length > 1) {
                          onSelectGroup(userGroups.find(g => g.id !== group.id).id);
                        }
                      } catch (e) {
                        console.error(e);
                        alert("Failed to leave group");
                      }
                    }
                  }}
                  className="btn btn-danger"
                  style={{ width: '40px', padding: '0', justifyContent: 'center', borderRadius: '12px' }}
                  title="Leave Group"
                >
                  <X size={16} />
                </button>
              </div>
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

        {/* --- AI SETTINGS SECTION --- */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h3 className="text-sm font-bold text-muted flex items-center gap-1"><Settings size={14} /> AI Settings</h3>
            <button onClick={() => setShowSettings(!showSettings)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}>
               <Key size={16} />
            </button>
          </div>
          {showSettings && (
             <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '12px' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gemini API Key (Saved locally)</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="AIzaSy..." 
                  value={apiKeyInput} 
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  style={{ padding: '8px 12px' }}
                />
                <button 
                  className="btn" 
                  onClick={() => {
                    setApiKey(apiKeyInput);
                    alert("API Key saved securely in your browser.");
                    setShowSettings(false);
                  }} 
                  style={{ width: '100%', padding: '8px 16px' }}>
                  Save Key
                </button>
             </div>
          )}
        </div>


        {/* --- MEMBERS SECTION --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 className="text-sm font-bold text-muted flex items-center gap-1"><User size={14} /> Group Members</h3>
          <button onClick={() => setShowInvite(!showInvite)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}>
            <UserPlus size={16} />
          </button>
        </div>
        
        {showInvite && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input 
              type="email" 
              className="input-field" 
              placeholder="Friend's email..." 
              value={inviteEmail} 
              onChange={(e) => setInviteEmail(e.target.value)}
              style={{ padding: '8px 12px', flex: 1 }}
            />
            <button className="btn" onClick={handleInvite} disabled={inviting} style={{ width: 'auto', padding: '8px 16px' }}>
              Add
            </button>
          </div>
        )}

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
