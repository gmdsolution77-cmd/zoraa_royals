'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LayoutDashboard,
  Gamepad2,
  Activity,
  CreditCard,
  Coins,
  FileSpreadsheet,
  MessageSquare,
  ShieldCheck,
  Gift,
  Users,
  UserCheck,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Check,
  X,
  Search,
  Download,
  Send,
  Eye,
  AlertCircle,
  RefreshCw,
  Key,
  Clock,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  DollarSign,
  UserMinus,
  Menu,
  ArrowLeft,
  Bell,
  Music,
  ExternalLink,
  Edit2,
  Upload,
  Power,
  ImageIcon,
  Smartphone,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  QrCode,
  Tag,
  Copy,
  Radio,
  Megaphone,
  Headphones,
  Paperclip,
} from 'lucide-react';
import FinanceDepositsView from '@/components/admin/FinanceDepositsView';
import FinanceRedemptionsView from '@/components/admin/FinanceRedemptionsView';
import FinanceUnifiedDesk from '@/components/admin/FinanceUnifiedDesk';
import AccountRequestsView from '@/components/admin/AccountRequestsView';
import CoinOperationsDesk from '@/components/admin/CoinOperationsDesk';
import SoundSettingsModal from '@/components/admin/SoundSettingsModal';
import IncomingRequestToast from '@/components/admin/IncomingRequestToast';
import Patron360ProfileModal from '@/components/admin/Patron360ProfileModal';
import {
  playTune,
  unlockAudioContext,
  AVAILABLE_TUNES,
  sendDesktopNotification,
  updateFaviconBadge,
  requestDesktopNotificationPermission,
} from '@/lib/soundAlerts';

export default function AdminPortal({ initialTab }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Normalize tab
  const normalizeTab = (tab) => {
    if (!tab) return 'overview';
    if (tab === 'dashboard') return 'overview';
    if (tab === 'requests') return 'account_requests';
    if (tab === 'support') return 'chat';
    if (tab === 'coins' || tab === 'coins_allotment') return 'coins_allotment';
    return tab;
  };

  const [activeTab, setActiveTab] = useState(() => normalizeTab(initialTab));

  // Audio Alerts State
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState(true);
  const [alertTune, setAlertTune] = useState('chaching');
  const [alertVolume, setAlertVolume] = useState(0.7);
  const [soundModalOpen, setSoundModalOpen] = useState(false);
  const [activeAlertToast, setActiveAlertToast] = useState(null);
  const [refreshingFinance, setRefreshingFinance] = useState(false);

  // Load sound settings from localStorage on mount & request desktop notifications
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTune = localStorage.getItem('zorra_admin_alert_tune');
      if (savedTune) setAlertTune(savedTune);
      const savedVol = localStorage.getItem('zorra_admin_alert_volume');
      if (savedVol) setAlertVolume(parseFloat(savedVol));
      const savedEnabled = localStorage.getItem('zorra_admin_alert_enabled');
      if (savedEnabled !== null) setAudioAlertsEnabled(savedEnabled !== 'false');

      // Request Chrome desktop notification permission on user interaction
      const promptPerm = () => {
        requestDesktopNotificationPermission().catch(() => {});
      };
      window.addEventListener('click', promptPerm, { once: true });
      return () => window.removeEventListener('click', promptPerm);
    }
  }, []);

  const handleSelectTune = (tuneId) => {
    setAlertTune(tuneId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zorra_admin_alert_tune', tuneId);
    }
  };

  const handleChangeVolume = (vol) => {
    setAlertVolume(vol);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zorra_admin_alert_volume', vol.toString());
    }
  };

  const handleToggleSound = (enabled) => {
    setAudioAlertsEnabled(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zorra_admin_alert_enabled', enabled ? 'true' : 'false');
    }
  };

  const playAdminChime = (overrideTune = null) => {
    if (!audioAlertsEnabled || typeof window === 'undefined') return;
    try {
      unlockAudioContext();
      playTune(overrideTune || alertTune, alertVolume);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  // Player Accounts State (users tab)
  const [usersList, setUsersList] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedPatronId, setSelectedPatronId] = useState(null);
  const [patronFilter, setPatronFilter] = useState('all');

  // Login form state if unauthenticated
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Overview Stats
  const [stats, setStats] = useState(null);

  // Games Tab state
  const [games, setGames] = useState([]);
  const [newGame, setNewGame] = useState({
    title: '',
    provider: 'Zorra Royal Studio',
    thumbnail: '/images/vegas-777.webp',
    badge: 'HOT',
    url: '',
    isActive: true,
  });
  const [editingGame, setEditingGame] = useState(null);
  const [isSavingGame, setIsSavingGame] = useState(false);

  const handleGameImageFile = (file, callback) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 500;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/webp', 0.85);
        callback(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Finance state
  const [financeSubTab, setFinanceSubTab] = useState('deposits');
  const [deposits, setDeposits] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [newMethod, setNewMethod] = useState({
    name: '',
    type: 'cashapp',
    tag: 'Instant',
    accountDetails: '',
    paymentUrl: '',
    qrCode: '',
    instructions: '',
    minDeposit: 10,
    maxDeposit: 2500,
  });
  const [editGatewayModal, setEditGatewayModal] = useState({ open: false, data: null, saving: false });
  const [editGameModal, setEditGameModal] = useState({ open: false, data: null, saving: false });
  const [editPromoModal, setEditPromoModal] = useState({ open: false, data: null, saving: false });
  const [editStaffModal, setEditStaffModal] = useState({ open: false, data: null, saving: false });
  const [editPatronModal, setEditPatronModal] = useState({ open: false, data: null, saving: false });
  const [previewQrModal, setPreviewQrModal] = useState(null);

  // Ledger state
  const [ledgerRecords, setLedgerRecords] = useState([]);
  const [ledgerFilterUser, setLedgerFilterUser] = useState('');
  const [ledgerFilterType, setLedgerFilterType] = useState('all');
  const [previewProofImage, setPreviewProofImage] = useState(null);
  const [selectedTxDetail, setSelectedTxDetail] = useState(null);

  // Live Chat state
  const [chatConversations, setChatConversations] = useState([]);
  const [activeChatConv, setActiveChatConv] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatReplyText, setChatReplyText] = useState('');
  const [chatAttachedImage, setChatAttachedImage] = useState(null);
  const [isUploadingChatImage, setIsUploadingChatImage] = useState(false);
  const [adminChatPreviewImage, setAdminChatPreviewImage] = useState(null);
  const adminChatFileInputRef = useRef(null);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [chatFilterTab, setChatFilterTab] = useState('all');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const messagesEndRef = useRef(null);

  // KYC state
  const [kycRequests, setKycRequests] = useState([]);
  const [selectedKycDoc, setSelectedKycDoc] = useState(null);

  // Promo & Multi-Channel Full Suite State (Vegas One Level)
  const [promoActiveSubTab, setPromoActiveSubTab] = useState('campaigns'); // 'campaigns' | 'broadcast'
  const [promos, setPromos] = useState([]);
  const [promoSearchQuery, setPromoSearchQuery] = useState('');
  const [promoFilter, setPromoFilter] = useState('all'); // 'all' | 'active' | 'freeplay' | 'deposit_boost'
  const [showCreatePromoModal, setShowCreatePromoModal] = useState(false);
  const [newPromoData, setNewPromoData] = useState({
    code: '',
    title: '',
    description: '',
    rewardUSD: '10',
    minDeposit: '0',
    tag: 'EXCLUSIVE',
    expiresAt: '',
    isActive: true,
  });
  const [isSavingPromo, setIsSavingPromo] = useState(false);

  // Broadcast & Push State
  const [broadcastLogs, setBroadcastLogs] = useState([]);
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [pushChannel, setPushChannel] = useState('all');
  const [pushSegment, setPushSegment] = useState('all');
  const [pushActionUrl, setPushActionUrl] = useState('/');
  const [pushStatus, setPushStatus] = useState(null);
  const [isDispatchingPush, setIsDispatchingPush] = useState(false);

  // Staff Management state
  const [staffList, setStaffList] = useState([]);
  const [newStaff, setNewStaff] = useState({ username: '', email: '', password: '', role: 'financial_manager' });

  // Custom editable deposit coin allotment state
  const [customDepositSC, setCustomDepositSC] = useState({});

  // Mobile navigation drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // System Settings state
  const [sysSettings, setSysSettings] = useState(null);
  const [savingBonusSettings, setSavingBonusSettings] = useState(false);
  const [bonusSaveMessage, setBonusSaveMessage] = useState(null);

  const handleSaveBonusSettings = async (e) => {
    if (e) e.preventDefault();
    setSavingBonusSettings(true);
    setBonusSaveMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          welcomeBonusPercent: Number(sysSettings?.welcomeBonusPercent ?? 100),
          welcomeBonusMax: Number(sysSettings?.welcomeBonusMax ?? 5000),
          welcomeBonusTitle: sysSettings?.welcomeBonusTitle || 'WELCOME BONUS',
          welcomeBonusSubtitle: sysSettings?.welcomeBonusSubtitle || 'Claim a 100% royal match on your first deposit! Fast credits & prompt payouts.',
          regularBonusPercent: Number(sysSettings?.regularBonusPercent ?? 20),
          regularBonusMax: Number(sysSettings?.regularBonusMax ?? 2000),
          regularBonusTitle: sysSettings?.regularBonusTitle || 'REGULAR RELOAD BONUS',
          regularBonusSubtitle: sysSettings?.regularBonusSubtitle || 'Enjoy a 20% bonus on every reload! Boost your palace treasury anytime.',
          referralBonusPercent: Number(sysSettings?.referralBonusPercent ?? 50),
          referralBonusTitle: sysSettings?.referralBonusTitle || 'FRIEND REFERRAL BONUS',
          referralBonusSubtitle: sysSettings?.referralBonusSubtitle || 'Earn instant % bonus directly into your wallet when friends join and complete their first deposit!',
          minCashoutThreshold: Number(sysSettings?.minCashoutThreshold ?? sysSettings?.minWithdrawal ?? 50),
          minWithdrawal: Number(sysSettings?.minCashoutThreshold ?? sysSettings?.minWithdrawal ?? 50),
          geoRestrictionEnabled: Boolean(sysSettings?.geoRestrictionEnabled),
        }),
      });
      const data = await res.json();
      setSavingBonusSettings(false);
      if (data.success) {
        setBonusSaveMessage('Bonus configuration saved successfully!');
        setTimeout(() => setBonusSaveMessage(null), 3500);
      } else {
        alert(data.error || 'Failed to save settings.');
      }
    } catch (err) {
      setSavingBonusSettings(false);
      alert('Error saving settings: ' + err.message);
    }
  };

  // Promo Handlers
  const handleCreatePromoCode = async (e) => {
    if (e) e.preventDefault();
    if (!newPromoData.code.trim()) {
      alert('Please enter a coupon promo code.');
      return;
    }
    setIsSavingPromo(true);
    try {
      const res = await fetch('/api/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin_create',
          ...newPromoData,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setShowCreatePromoModal(false);
        setNewPromoData({
          code: '',
          title: '',
          description: '',
          rewardUSD: '10',
          minDeposit: '0',
          tag: 'EXCLUSIVE',
          expiresAt: '',
          isActive: true,
        });
        const refRes = await fetch('/api/promos?all=true').then(r => r.json());
        if (refRes.success) setPromos(refRes.promotions || []);
      } else {
        alert(d.error || 'Failed to create promo code.');
      }
    } catch (err) {
      alert(err.message || 'Error creating promo.');
    } finally {
      setIsSavingPromo(false);
    }
  };

  const handleTogglePromoActive = async (promo) => {
    const promoId = promo.id || promo._id;
    if (!promoId) return;
    try {
      const res = await fetch('/api/promos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: promoId,
          isActive: !promo.isActive,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setPromos(prev =>
          prev.map(p => ((p.id || p._id) === promoId ? { ...p, isActive: !p.isActive } : p))
        );
      } else {
        alert(d.error || 'Failed to update promo status');
      }
    } catch (err) {
      alert('Error updating promo: ' + err.message);
    }
  };

  const handleDeletePromo = async (promo) => {
    const promoId = promo.id || promo._id;
    if (!promoId) {
      alert('Cannot delete: Promo ID is missing.');
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete promotion "${promo.title || promo.code}"?`)) return;
    try {
      const res = await fetch(`/api/promos?id=${promoId}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) {
        setPromos(prev => prev.filter(p => (p.id || p._id) !== promoId));
      } else {
        alert(d.error || 'Failed to delete promo');
      }
    } catch (err) {
      alert('Error deleting promo: ' + err.message);
    }
  };

  // Edit Handlers for Games, Gateways, Promos, Staff, Patrons
  const handleSaveEditGame = async (e) => {
    if (e) e.preventDefault();
    if (!editGameModal.data?.id && !editGameModal.data?._id) return;
    setEditGameModal(prev => ({ ...prev, saving: true }));
    try {
      const res = await fetch('/api/games', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editGameModal.data.id || editGameModal.data._id,
          title: editGameModal.data.title,
          provider: editGameModal.data.provider,
          thumbnail: editGameModal.data.thumbnail,
          badge: editGameModal.data.badge,
          url: editGameModal.data.url,
          category: editGameModal.data.category,
          isActive: editGameModal.data.isActive,
          isHot: editGameModal.data.badge === 'HOT',
          isFeatured: editGameModal.data.badge === 'EXCLUSIVE' || editGameModal.data.badge === 'POPULAR',
        }),
      });
      const d = await res.json();
      if (d.success) {
        setGames(prev => prev.map(g => (g.id === editGameModal.data.id || g._id === editGameModal.data._id) ? { ...g, ...editGameModal.data } : g));
        setEditGameModal({ open: false, data: null, saving: false });
      } else {
        alert(d.error || 'Failed to update game');
        setEditGameModal(prev => ({ ...prev, saving: false }));
      }
    } catch (err) {
      alert(err.message);
      setEditGameModal(prev => ({ ...prev, saving: false }));
    }
  };

  const handleSaveEditGateway = async (e) => {
    if (e) e.preventDefault();
    if (!editGatewayModal.data?.id && !editGatewayModal.data?._id) return;
    setEditGatewayModal(prev => ({ ...prev, saving: true }));
    try {
      const res = await fetch('/api/payments/methods', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editGatewayModal.data.id || editGatewayModal.data._id,
          name: editGatewayModal.data.name,
          type: editGatewayModal.data.type,
          accountDetails: editGatewayModal.data.accountDetails,
          paymentUrl: editGatewayModal.data.paymentUrl,
          instructions: editGatewayModal.data.instructions,
          qrCode: editGatewayModal.data.qrCode,
          minDeposit: Number(editGatewayModal.data.minDeposit),
          maxDeposit: Number(editGatewayModal.data.maxDeposit),
          isActive: editGatewayModal.data.isActive,
          tag: editGatewayModal.data.tag,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setPaymentMethods(prev => prev.map(m => (m.id === editGatewayModal.data.id || m._id === editGatewayModal.data._id) ? { ...m, ...editGatewayModal.data } : m));
        setEditGatewayModal({ open: false, data: null, saving: false });
      } else {
        alert(d.error || 'Failed to update gateway');
        setEditGatewayModal(prev => ({ ...prev, saving: false }));
      }
    } catch (err) {
      alert(err.message);
      setEditGatewayModal(prev => ({ ...prev, saving: false }));
    }
  };

  const handleSaveEditPromo = async (e) => {
    if (e) e.preventDefault();
    if (!editPromoModal.data?.id && !editPromoModal.data?._id) return;
    setEditPromoModal(prev => ({ ...prev, saving: true }));
    try {
      const res = await fetch('/api/promos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editPromoModal.data.id || editPromoModal.data._id,
          code: editPromoModal.data.code,
          title: editPromoModal.data.title,
          description: editPromoModal.data.description,
          rewardUSD: Number(editPromoModal.data.rewardUSD || editPromoModal.data.rewardSC || 0),
          rewardSC: Number(editPromoModal.data.rewardUSD || editPromoModal.data.rewardSC || 0),
          minDeposit: Number(editPromoModal.data.minDeposit || 0),
          tag: editPromoModal.data.tag,
          isActive: editPromoModal.data.isActive,
          expiresAt: editPromoModal.data.expiresAt,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setPromos(prev => prev.map(p => (p.id === editPromoModal.data.id || p._id === editPromoModal.data._id) ? { ...p, ...editPromoModal.data } : p));
        setEditPromoModal({ open: false, data: null, saving: false });
      } else {
        alert(d.error || 'Failed to update promo');
        setEditPromoModal(prev => ({ ...prev, saving: false }));
      }
    } catch (err) {
      alert(err.message);
      setEditPromoModal(prev => ({ ...prev, saving: false }));
    }
  };

  const handleSaveEditStaff = async (e) => {
    if (e) e.preventDefault();
    if (!editStaffModal.data?.id && !editStaffModal.data?._id) return;
    setEditStaffModal(prev => ({ ...prev, saving: true }));
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: editStaffModal.data.id || editStaffModal.data._id,
          username: editStaffModal.data.username,
          email: editStaffModal.data.email,
          role: editStaffModal.data.role,
          isBanned: editStaffModal.data.isBanned,
          newPassword: editStaffModal.data.newPassword || undefined,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setStaffList(prev => prev.map(s => (s.id === editStaffModal.data.id || s._id === editStaffModal.data._id) ? { ...s, ...editStaffModal.data } : s));
        setEditStaffModal({ open: false, data: null, saving: false });
      } else {
        alert(d.error || 'Failed to update staff member');
        setEditStaffModal(prev => ({ ...prev, saving: false }));
      }
    } catch (err) {
      alert(err.message);
      setEditStaffModal(prev => ({ ...prev, saving: false }));
    }
  };

  const handleDeleteStaff = async (staffId, username) => {
    if (!confirm(`Permanently remove staff officer "${username}"?`)) return;
    try {
      const res = await fetch(`/api/admin/staff?id=${encodeURIComponent(staffId)}`, { method: 'DELETE' });
      const d = await res.json();
      if (d.success) {
        setStaffList(prev => prev.filter(s => s.id !== staffId && s._id !== staffId));
        setEditStaffModal({ open: false, data: null, saving: false });
      } else {
        alert(d.error || 'Failed to delete staff member');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSaveEditPatron = async (e) => {
    if (e) e.preventDefault();
    if (!editPatronModal.data?.id && !editPatronModal.data?._id) return;
    setEditPatronModal(prev => ({ ...prev, saving: true }));
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editPatronModal.data.id || editPatronModal.data._id,
          action: 'updateProfile',
          username: editPatronModal.data.username,
          email: editPatronModal.data.email,
          kycStatus: editPatronModal.data.kycStatus,
          isBanned: editPatronModal.data.isBanned,
          banReason: editPatronModal.data.banReason,
          newPassword: editPatronModal.data.newPassword || undefined,
        }),
      });
      const d = await res.json();
      if (d.success) {
        setUsersList(prev => prev.map(u => (u.id === editPatronModal.data.id || u._id === editPatronModal.data._id) ? { ...u, ...editPatronModal.data } : u));
        setEditPatronModal({ open: false, data: null, saving: false });
      } else {
        alert(d.error || 'Failed to update patron profile');
        setEditPatronModal(prev => ({ ...prev, saving: false }));
      }
    } catch (err) {
      alert(err.message);
      setEditPatronModal(prev => ({ ...prev, saving: false }));
    }
  };

  const handleDispatchBroadcast = async (e) => {
    if (e) e.preventDefault();
    if (!pushTitle.trim() || !pushBody.trim()) {
      alert('Please provide both headline and message body.');
      return;
    }

    setIsDispatchingPush(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pushTitle,
          message: pushBody,
          channel: pushChannel,
          segment: pushSegment,
          url: pushActionUrl,
          target: pushSegment === 'all' ? 'all' : 'active',
        }),
      });
      const d = await res.json();
      if (d.success) {
        setPushStatus(`✓ Broadcast sent via [${pushChannel.toUpperCase()}] to [${pushSegment.toUpperCase()}]!`);
        setPushTitle('');
        setPushBody('');
        const logsRes = await fetch('/api/notifications?admin=true').then(r => r.json());
        if (logsRes.success) setBroadcastLogs(logsRes.broadcasts || []);
        setTimeout(() => setPushStatus(null), 5000);
      } else {
        alert(d.error || 'Failed to dispatch broadcast.');
      }
    } catch (err) {
      alert(err.message || 'Error dispatching broadcast.');
    } finally {
      setIsDispatchingPush(false);
    }
  };

  // Account Requests state
  const [accountRequests, setAccountRequests] = useState([]);
  const [accountReqFilter, setAccountReqFilter] = useState('PENDING');
  const [approvalModal, setApprovalModal] = useState({ open: false, request: null, username: '', password: '' });
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const fetchAccountRequests = () => {
    fetch(`/api/account-requests?status=${accountReqFilter}`)
      .then(r => r.json())
      .then(d => { if (d.success) setAccountRequests(d.accountRequests || []); })
      .catch(() => { });
  };

  const handleOpenApproveModal = (req) => {
    const rawIdentifier = req.userName || (req.userEmail ? req.userEmail.split('@')[0] : 'royal');
    const cleanUser = String(rawIdentifier).toLowerCase().replace(/[^a-z0-9]/g, '') || 'royal';
    const randSuf = Math.floor(100 + Math.random() * 900);
    const randPass = 'Royal' + Math.floor(1000 + Math.random() * 9000);
    setApprovalModal({
      open: true,
      request: req,
      username: `${cleanUser}${randSuf}`,
      password: randPass,
    });
  };

  const handleConfirmApproval = async () => {
    if (!approvalModal.request || !approvalModal.username || !approvalModal.password) return;
    setSubmittingApproval(true);
    try {
      const res = await fetch('/api/account-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: approvalModal.request.id,
          action: 'approve',
          username: approvalModal.username,
          password: approvalModal.password,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setApprovalModal({ open: false, request: null, username: '', password: '' });
        fetchAccountRequests();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleCancelRequest = async (id) => {
    const reason = prompt('Enter rejection reason for player:', 'Temporary platform maintenance. Escrow balance refunded to your wallet.');
    if (!reason) return;
    try {
      await fetch('/api/account-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'cancel', reason }),
      });
      fetchAccountRequests();
    } catch (e) {
      console.error(e);
    }
  };

  // Coins Allotment state & handlers
  const [allotmentSearch, setAllotmentSearch] = useState('');
  const [allotmentPlayers, setAllotmentPlayers] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [allotmentAction, setAllotmentAction] = useState('credit');
  const [allotmentCurrency, setAllotmentCurrency] = useState('USD');
  const [allotmentAmount, setAllotmentAmount] = useState('');
  const [allotmentReason, setAllotmentReason] = useState('Deposit Match');
  const [allotmentLoading, setAllotmentLoading] = useState(false);
  const [allotmentSuccessMsg, setAllotmentSuccessMsg] = useState(null);
  const [allotmentErrorMsg, setAllotmentErrorMsg] = useState(null);
  const [allotmentHistory, setAllotmentHistory] = useState([]);
  const [allotmentLedgerFilter, setAllotmentLedgerFilter] = useState('all');

  const fetchAllotmentData = (searchQuery = allotmentSearch) => {
    fetch(`/api/coins/allotment?q=${encodeURIComponent(searchQuery)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const players = d.players || [];
          setAllotmentPlayers(players);
          setSelectedPlayer(prev => {
            if (prev) {
              const updated = players.find(p => p.id === prev.id);
              return updated || prev;
            }
            return players.length > 0 ? players[0] : null;
          });
        }
      })
      .catch(() => { });

    fetch('/api/coins/allotment?history=true')
      .then(r => r.json())
      .then(d => {
        if (d.success) setAllotmentHistory(d.history || []);
      })
      .catch(() => { });
  };

  const handleExecuteAllotment = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPlayer) {
      setAllotmentErrorMsg('Please search and select a player first.');
      return;
    }
    const num = Number(allotmentAmount);
    if (!num || num <= 0) {
      setAllotmentErrorMsg('Please specify an amount greater than zero.');
      return;
    }
    if (!allotmentReason.trim()) {
      setAllotmentErrorMsg('Please provide an audit reason.');
      return;
    }

    setAllotmentLoading(true);
    setAllotmentSuccessMsg(null);
    setAllotmentErrorMsg(null);

    try {
      const res = await fetch('/api/coins/allotment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: selectedPlayer.id,
          action: allotmentAction,
          currency: allotmentCurrency,
          amount: num,
          reason: allotmentReason.trim(),
        }),
      });
      const data = await res.json();
      setAllotmentLoading(false);
      if (data.success) {
        setAllotmentSuccessMsg(data.message || `Successfully executed ${allotmentAction} of $${num} USD.`);
        setSelectedPlayer(prev => prev ? {
          ...prev,
          balance: data.newBalance,
          balanceSC: data.newBalance,
        } : null);
        setAllotmentAmount('');
        fetchAllotmentData();
      } else {
        setAllotmentErrorMsg(data.error || 'Failed to execute allotment.');
      }
    } catch (err) {
      setAllotmentLoading(false);
      setAllotmentErrorMsg('Network error: ' + err.message);
    }
  };

  // Check current session
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if ((data.authenticated || data.success) && data.user && data.user.role !== 'player') {
        setUser(data.user);
        if (initialTab) {
          setActiveTab(normalizeTab(initialTab));
        } else if (data.user.role === 'coin_manager') {
          setActiveTab('coins_allotment');
        } else if (data.user.role === 'chat_support') {
          setActiveTab('chat');
        } else {
          setActiveTab('overview');
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  // Persistent background sync: deposits, redemptions, and game account requests are ALWAYS monitored
  const prevCountsRef = useRef({ requests: 0, deposits: 0, redemptions: 0, coinCashouts: 0 });
  const isInitialLoadRef = useRef(true);

  const syncRequestsAndAlerts = async () => {
    if (!user) return;
    try {
      const [depRes, withRes, reqRes] = await Promise.all([
        fetch('/api/payments/deposit?status=all'),
        fetch('/api/payments/withdraw?status=all'),
        fetch('/api/account-requests?status=all'),
      ]);

      const [depData, withData, reqData] = await Promise.all([
        depRes.json(),
        withRes.json(),
        reqRes.json(),
      ]);

      if (depData.success) {
        setDeposits(depData.deposits || []);
      }
      if (withData.success) {
        setRedemptions(withData.redemptions || []);
      }
      if (reqData.success) {
        setAccountRequests(reqData.accountRequests || []);
      }

      const pendingDeps = (depData.deposits || []).filter(d => d.status === 'pending');
      const pendingWith = (withData.redemptions || []).filter(r => r.status === 'pending');
      const pendingReqs = (reqData.accountRequests || []).filter(r => (r.status || '').toUpperCase() === 'PENDING');
      const pendingCoinCashouts = (withData.redemptions || []).filter(r => r.status === 'pending_coin' || r.stage === 'coin_verification');

      const totalPending = pendingDeps.length + pendingWith.length + pendingReqs.length + pendingCoinCashouts.length;
      updateFaviconBadge(totalPending);

      if (isInitialLoadRef.current) {
        prevCountsRef.current = {
          deposits: pendingDeps.length,
          redemptions: pendingWith.length,
          requests: pendingReqs.length,
          coinCashouts: pendingCoinCashouts.length,
        };
        isInitialLoadRef.current = false;
        return;
      }

      // 1. Check for incoming new deposits (Finance)
      if (pendingDeps.length > (prevCountsRef.current.deposits || 0)) {
        const newest = pendingDeps[0];
        playAdminChime();
        sendDesktopNotification(
          '💰 New Deposit Request!',
          `$${Number(newest?.amount || 0).toFixed(2)} USD from ${newest?.username || 'Player'} (${newest?.methodName || 'Payment'})`,
          '/admin?tab=finance'
        );
        setActiveAlertToast({
          type: 'deposit',
          title: 'New Deposit Request!',
          message: `$${Number(newest?.amount || 0).toFixed(2)} USD from ${newest?.username || 'Player'}`,
          subtext: `Via ${newest?.methodName || 'Payment'}${newest?.senderNote ? ` • ${newest.senderNote}` : ''}`,
          targetTab: 'finance',
          targetSubTab: 'deposits',
        });
      }
      // 2. Check for incoming new redemptions (Finance Stage 2)
      else if (pendingWith.length > (prevCountsRef.current.redemptions || 0)) {
        const newest = pendingWith[0];
        playAdminChime();
        sendDesktopNotification(
          '💸 New Cashout Request!',
          `$${Number(newest?.amount || 0).toFixed(2)} USD for ${newest?.username || 'Player'} via ${newest?.payoutMethod || 'Direct'}`,
          '/admin?tab=finance'
        );
        setActiveAlertToast({
          type: 'redemption',
          title: 'New Cashout Request!',
          message: `$${Number(newest?.amount || 0).toFixed(2)} USD for ${newest?.username || 'Player'}`,
          subtext: `Payout via ${newest?.payoutMethod || 'Direct'}: ${newest?.destinationAddress || ''}`,
          targetTab: 'finance',
          targetSubTab: 'redemptions',
        });
      }
      // 3. Check for incoming coin cashout proof verifications (Stage 1 Coins Allotment Desk)
      else if (pendingCoinCashouts.length > (prevCountsRef.current.coinCashouts || 0)) {
        const newest = pendingCoinCashouts[0];
        playAdminChime();
        sendDesktopNotification(
          '🎮 New Cashout Verification (Coins Desk)!',
          `$${Number(newest?.amount || 0).toFixed(2)} USD for ${newest?.username || 'Player'} (${newest?.gameTitle || 'Game'})`,
          '/admin?tab=coins_allotment'
        );
        setActiveAlertToast({
          type: 'coin_verification',
          title: 'New Cashout Verification (Coins Desk)!',
          message: `$${Number(newest?.amount || 0).toFixed(2)} USD for ${newest?.username || 'Player'}`,
          subtext: `${newest?.gameTitle || 'Game'} winning proof uploaded • Stage 1 Inspection`,
          targetTab: 'coins_allotment',
          targetSubTab: 'cashouts',
        });
      }
      // 4. Check for incoming new game account / load requests (Coins Allotment)
      else if (pendingReqs.length > (prevCountsRef.current.requests || 0)) {
        const newest = pendingReqs[0];
        playAdminChime();
        sendDesktopNotification(
          '⚡ New Game Account / Load Request!',
          `${newest?.gameTitle || 'Game'} request from ${newest?.userName || 'Player'}`,
          '/admin?tab=coins_allotment'
        );
        setActiveAlertToast({
          type: 'account',
          title: 'New Game Request!',
          message: `${newest?.gameTitle || 'Game'} request from ${newest?.userName || 'Player'}`,
          subtext: newest?.transferAmount > 0 ? `Load Amount: $${newest?.transferAmount} USD (Escrow Frozen)` : 'Ready to issue credentials',
          targetTab: 'coins_allotment',
          targetSubTab: 'loads',
        });
      }

      prevCountsRef.current = {
        deposits: pendingDeps.length,
        redemptions: pendingWith.length,
        requests: pendingReqs.length,
        coinCashouts: pendingCoinCashouts.length,
      };
    } catch (err) {
      console.warn('Background sync error:', err);
    }
  };

  // Run persistent poller every 3.5 seconds
  useEffect(() => {
    if (!user) return;
    syncRequestsAndAlerts();
    const interval = setInterval(syncRequestsAndAlerts, 3500);
    return () => clearInterval(interval);
  }, [user]);

  // Fetch data for specific active tabs
  useEffect(() => {
    if (!user) return;

    const loadData = () => {
      if (activeTab === 'overview') {
        fetch('/api/admin/stats').then(r => r.json()).then(d => { if (d.success) setStats(d.stats); });
      } else if (activeTab === 'games') {
        fetch('/api/games?all=true').then(r => r.json()).then(d => { if (d.success) setGames(d.games); });
      } else if (activeTab === 'finance') {
        fetch('/api/payments/methods?all=true').then(r => r.json()).then(d => { if (d.success) setPaymentMethods(d.methods || []); });
        fetch('/api/payments/deposit?status=all').then(r => r.json()).then(d => { if (d.success) setDeposits(d.deposits || []); });
        fetch('/api/payments/withdraw?status=all').then(r => r.json()).then(d => { if (d.success) setRedemptions(d.redemptions || []); });
      } else if (activeTab === 'chat') {
        fetch('/api/chat?inbox=true').then(r => r.json()).then(d => { if (d.success) setChatConversations(d.conversations || []); });
      } else if (activeTab === 'kyc') {
        fetch('/api/kyc?status=all').then(r => r.json()).then(d => { if (d.success) setKycRequests(d.requests || []); });
      } else if (activeTab === 'promos') {
        fetch('/api/promos?all=true').then(r => r.json()).then(d => { if (d.success) setPromos(d.promotions || []); });
        fetch('/api/notifications?admin=true').then(r => r.json()).then(d => { if (d.success) setBroadcastLogs(d.broadcasts || []); });
      } else if (activeTab === 'staff') {
        fetch('/api/admin/staff').then(r => r.json()).then(d => { if (d.success) setStaffList(d.staff || []); });
      } else if (activeTab === 'account_requests') {
        fetchAccountRequests();
      } else if (activeTab === 'coins_allotment') {
        fetchAllotmentData();
      } else if (activeTab === 'users') {
        fetch(`/api/users?search=${encodeURIComponent(userSearchQuery)}`).then(r => r.json()).then(d => { if (d.success) setUsersList(d.users || []); });
      } else if (activeTab === 'gateways') {
        fetch('/api/payments/methods?all=true').then(r => r.json()).then(d => { if (d.success) setPaymentMethods(d.methods || []); });
      } else if (activeTab === 'tx_search') {
        fetch(`/api/ledger?username=${encodeURIComponent(ledgerFilterUser)}&type=${ledgerFilterType}`).then(r => r.json()).then(d => { if (d.success) setLedgerRecords(d.records || []); });
      } else if (activeTab === 'settings') {
        fetch('/api/admin/settings').then(r => r.json()).then(d => { if (d.success) setSysSettings(d.settings); });
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [user, activeTab, ledgerFilterUser, ledgerFilterType, accountReqFilter, userSearchQuery, allotmentSearch]);

  // Load chat messages when active conversation selected
  useEffect(() => {
    if (!activeChatConv) return;
    const fetchChatMsgs = () => {
      fetch(`/api/chat?conversationId=${activeChatConv._id}`)
        .then(r => r.json())
        .then(d => { if (d.success) setChatMessages(d.messages || []); });
    };
    fetchChatMsgs();
    const interval = setInterval(fetchChatMsgs, 3000);
    return () => clearInterval(interval);
  }, [activeChatConv]);

  // Handle Admin Staff Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginId, password: loginPassword }),
      });
      const data = await res.json();
      if (data.success && data.user && data.user.role !== 'player') {
        setUser(data.user);
      } else {
        setLoginError(data.error || 'Access Denied: Not authorized for administration.');
      }
    } catch {
      setLoginError('Login failed.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  // Staff Permissions check (Affiliates removed)
  const isAllowed = (tabId) => {
    if (!user) return false;
    const r = (user.role || '').toLowerCase();

    if (r === 'super_admin' || r === 'admin') return true;
    if (r === 'operation_admin') {
      return !['staff', 'settings'].includes(tabId);
    }
    if (r === 'financial_manager' || r === 'financial_admin') {
      return ['overview', 'finance', 'coins_allotment', 'gateways', 'tx_search', 'kyc'].includes(tabId);
    }
    if (r === 'coin_manager' || r === 'coins_admin') {
      return ['overview', 'account_requests', 'coins_allotment', 'tx_search'].includes(tabId);
    }
    if (r === 'chat_support' || r === 'support_admin') {
      return ['overview', 'chat'].includes(tabId);
    }
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07080b] flex items-center justify-center text-gold-gradient font-serif font-black tracking-widest text-lg">
        INITIALIZING ZORRA ROYALS PALACE TERMINAL...
      </div>
    );
  }

  // Not Logged In as Staff Form (Styled with Zorra Royals Gold & Obsidian)
  if (!user) {
    return (
      <div className="min-h-screen bg-[#07080b] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0e111a] border border-[#d4af37]/35 rounded-3xl p-8 shadow-2xl shadow-black/80">
          <div className="text-center mb-6">
            <img
              src="/logo.png"
              alt="Zorra Royals"
              className="h-16 w-auto mx-auto mb-3 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]"
            />
            <h2 className="font-serif text-xl font-black text-white tracking-wider">
              ZORRA ROYALS <span className="text-[#ffd700]">STAFF TERMINAL</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">
              Royal Access Control System
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/35 text-red-300 text-xs text-center font-bold">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                Staff Username or Email
              </label>
              <input
                type="text"
                placeholder="superadmin, finance, coins, or support"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required
                className="w-full bg-[#07080b] border border-[#d4af37]/25 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-[#ffd700] transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full bg-[#07080b] border border-[#d4af37]/25 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-[#ffd700] transition"
              />
            </div>

            <button
              type="submit"
              className="w-full btn-gold py-3 text-xs font-black uppercase tracking-widest mt-2"
            >
              AUTHENTICATE STAFF
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#d4af37]/15 text-center">
            <Link href="/" className="text-xs text-[#ffd700] hover:text-white font-bold transition">
              ← Return to Palace Lobby
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Permitted Tabs matching Player Paradise structure
  const allTabs = [
    { id: 'overview', label: 'Overview Analytics', icon: LayoutDashboard, category: 'Operations' },
    {
      id: 'account_requests',
      label: 'Game Requests',
      icon: Key,
      badge: accountRequests.filter(r => (r.status || '').toUpperCase() === 'PENDING').length,
      category: 'Operations',
    },
    {
      id: 'finance',
      label: 'Financial Ledger',
      icon: CreditCard,
      badge: (deposits.filter(d => d.status === 'pending').length + redemptions.filter(r => r.status === 'pending').length),
      category: 'Operations',
    },
    {
      id: 'coins_allotment',
      label: 'Coins Allotment Queue',
      icon: Coins,
      badge: (
        (redemptions || []).filter(r => r.status === 'pending_coin' || r.stage === 'coin_verification').length +
        (accountRequests || []).filter(r => (r.status || '').toUpperCase() === 'PENDING').length
      ),
      category: 'Operations',
    },
    {
      id: 'chat',
      label: 'Live Support Chat',
      icon: MessageSquare,
      badge: chatConversations.filter(c => c.unreadStaff).length,
      category: 'Operations',
    },
    { id: 'games', label: 'Games Library', icon: Gamepad2, category: 'Catalog & Players' },
    { id: 'users', label: 'Player Accounts', icon: Users, category: 'Catalog & Players' },
    {
      id: 'kyc',
      label: 'KYC Verification',
      icon: ShieldCheck,
      badge: kycRequests.filter(k => k.status === 'pending').length,
      category: 'Catalog & Players',
    },
    { id: 'tx_search', label: 'Transaction Search', icon: FileSpreadsheet, category: 'Catalog & Players' },
    { id: 'gateways', label: 'Payment Gateways', icon: SlidersHorizontal, category: 'Growth & Promos' },
    { id: 'promos', label: 'Push & Promos', icon: Gift, category: 'Growth & Promos' },
    { id: 'staff', label: 'Staff Management', icon: UserCheck, category: 'System & Security' },
    { id: 'settings', label: 'System Settings', icon: Settings, category: 'System & Security' },
  ];

  const visibleTabs = allTabs.filter(t => isAllowed(t.id));

  return (
    <div className="h-screen bg-[#07080b] text-[#f8fafc] flex flex-col font-sans overflow-hidden">
      {/* Top Staff Navbar */}
      <header className="h-16 bg-[#090b10] border-b border-[#d4af37]/25 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Hamburger Toggle */}
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white cursor-pointer"
            aria-label="Toggle navigation drawer"
          >
            <Menu size={18} />
          </button>

          <Link href="/" className="inline-flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Zorra Royals"
              className="h-10 w-auto object-contain drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]"
            />
            <span className="font-serif font-black text-white text-sm tracking-wider hidden sm:inline">
              ZORRA ROYALS <span className="text-[#ffd700]">STAFF</span>
            </span>
          </Link>
          <span className="px-2.5 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/35 text-[#ffd700] text-[10px] font-black uppercase tracking-wider">
            {user?.role ? user.role.replace('_', ' ') : 'STAFF'}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Audio Chime Hub */}
          <div className="flex items-center bg-[#07080b] border border-[#d4af37]/40 rounded-full px-3 py-1 gap-2 shadow-inner">
            <button
              onClick={() => {
                unlockAudioContext();
                setSoundModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-[#ffd700] text-xs font-bold hover:text-white transition"
              title="Change notification chime or volume"
            >
              <span>{AVAILABLE_TUNES.find(t => t.id === alertTune)?.icon || '🔔'}</span>
              <span className="hidden md:inline">
                {AVAILABLE_TUNES.find(t => t.id === alertTune)?.name.split(' (')[0] || 'Chime'}
              </span>
              <span className="text-[10px] font-mono bg-[#d4af37]/20 text-[#ffd700] px-1.5 py-0.5 rounded font-black">
                {Math.round(alertVolume * 100)}%
              </span>
              <SlidersHorizontal size={11} className="opacity-70" />
            </button>

            <span className="w-px h-4 bg-white/10" />

            {/* Quick Mute / Unmute Button */}
            <button
              onClick={() => {
                const next = !audioAlertsEnabled;
                handleToggleSound(next);
                if (next) playAdminChime();
              }}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                audioAlertsEnabled
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-red-500/20 text-red-400 border border-red-500/40'
              }`}
              title={audioAlertsEnabled ? 'Mute Chimes' : 'Unmute Chimes'}
            >
              {audioAlertsEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            </button>
          </div>

          {/* User Profile Pill */}
          <div className="hidden sm:flex items-center gap-2 bg-[#0e111a] border border-[#d4af37]/20 rounded-full px-3 py-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[#ffd700] to-[#b38f26] text-black font-black flex items-center justify-center text-xs uppercase">
              {user.username ? user.username.charAt(0) : 'A'}
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-none">{user.username}</p>
              <p className="text-[9px] text-[#ffd700] font-mono uppercase tracking-wider">{user.role?.replace('_', ' ')}</p>
            </div>
          </div>

          {/* Exit to Lobby */}
          <Link
            href="/"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#07080b] border border-[#d4af37]/30 text-xs font-bold text-[#ffd700] hover:text-white transition"
          >
            <ArrowLeft size={13} />
            <span>Lobby</span>
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Main Admin Workspace - Flush Left Sidebar (Zero Space on the Left) */}
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {/* Mobile backdrop */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-black/85 z-40 backdrop-blur-md animate-in fade-in"
          />
        )}

        {/* Left Admin Navigation - Flush to the absolute left */}
        <aside
          className={`transition-all duration-300 z-50 md:static ${
            mobileSidebarOpen
              ? 'fixed inset-y-0 left-0 flex shadow-[0_0_60px_rgba(0,0,0,0.95)] border-r border-[#ffd700]/30'
              : 'hidden md:flex'
          }`}
          style={{
            width: '280px',
            minWidth: '280px',
            maxWidth: '85vw',
            height: '100%',
            backgroundColor: '#07080b',
            borderRight: '1px solid rgba(212, 175, 55, 0.2)',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Mobile Drawer Top Bar */}
          <div
            className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#07080b] shrink-0"
            style={{
              paddingTop: 'max(14px, env(safe-area-inset-top, 14px))',
            }}
          >
            <span className="text-xs font-black uppercase tracking-wider text-[#ffd700] flex items-center gap-2">
              <ShieldCheck size={14} />
              Navigation Menu
            </span>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white cursor-pointer"
              aria-label="Close drawer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Categorized Navigation Links */}
          <div className="overflow-y-auto scrollbar-none flex-1 p-2.5 space-y-4">
            {['Operations', 'Catalog & Players', 'Growth & Promos', 'System & Security'].map((category, secIdx) => {
              const categoryTabs = visibleTabs.filter(t => t.category === category);
              if (categoryTabs.length === 0) return null;
              return (
                <div key={secIdx}>
                  <p className="px-3 pb-1.5 text-[10px] uppercase font-black tracking-widest text-[#d4af37]/70 font-mono">
                    {category}
                  </p>

                  <div className="space-y-1">
                    {categoryTabs.map(tab => {
                      const Icon = tab.icon;
                      const isSelected = activeTab === tab.id;
                      const hasBadge = Boolean(tab.badge && tab.badge > 0);

                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(tab.id);
                            setMobileSidebarOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#ffd700] via-[#d4af37] to-[#b38f26] text-black shadow-[0_4px_16px_rgba(212,175,55,0.35)] font-black'
                              : 'text-gray-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Icon size={16} className={isSelected ? 'text-black stroke-[2.5]' : 'text-gray-400'} />
                            <span className="truncate">{tab.label}</span>
                          </div>

                          {hasBadge && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                                isSelected
                                  ? 'bg-black text-[#ffd700]'
                                  : 'bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/40'
                              }`}
                            >
                              {tab.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar Footer matching Player Paradise layout */}
          <div className="p-3 border-t border-white/10 bg-[#07080b] shrink-0 space-y-2">
            <div className="p-2.5 rounded-xl bg-[#121624] border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#ffd700] to-[#997b24] text-black flex items-center justify-center font-black text-xs shrink-0">
                  {user?.username ? user.username.charAt(0).toUpperCase() : 'A'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">
                    {user?.username || 'Super Admin'}
                  </div>
                  <div className="text-[9px] text-[#ffd700] uppercase font-mono truncate">
                    {user?.role?.replace('_', ' ') || 'Super Admin'}
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab('chat');
                setMobileSidebarOpen(false);
              }}
              className="w-full py-2 px-3 rounded-xl bg-[#10141e] border border-[rgba(212,175,55,0.35)] text-[#ffd700] text-xs font-black flex items-center justify-center gap-2 hover:bg-[#1a2030] transition shadow-md cursor-pointer"
            >
              <Headphones size={14} />
              <span>24/7 VIP LIVE SUPPORT</span>
            </button>

            <Link
              href="/download-app"
              target="_blank"
              className="w-full py-2 px-3 rounded-xl bg-[#ffd700]/10 border border-[#ffd700]/30 hover:border-[#ffd700] text-[#ffd700] hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Smartphone size={13} />
              <span>Portal APK Shell</span>
              <ExternalLink size={10} className="opacity-60" />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2 px-3 rounded-xl bg-red-950/40 border border-red-500/30 hover:bg-red-900/60 text-red-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Dynamic Tab Body - Flush and fills remaining space */}
        <main
          className={`flex-1 flex flex-col min-h-0 bg-[#07080b] ${
            activeTab === 'chat' ? 'p-2 sm:p-4 overflow-hidden' : 'p-3 sm:p-6 overflow-y-auto'
          }`}
          style={{ flex: 1 }}
        >
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black font-serif text-white tracking-wide">Palace Operations Overview</h2>
                  <p className="text-xs text-gray-400 mt-1">Real-time financial summary &amp; active action queues</p>
                </div>
                <button
                  onClick={() => fetch('/api/admin/stats').then(r => r.json()).then(d => { if (d.success) setStats(d.stats); })}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition"
                  title="Refresh Statistics"
                >
                  <RefreshCw size={15} />
                </button>
              </div>

              {/* Financial Summary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#131622] border border-emerald-500/30 p-5 rounded-2xl">
                  <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Total Received Deposits</p>
                  <p className="text-3xl font-black text-emerald-300 font-mono mt-1">
                    ${Number(stats?.totalDeposited || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-[#131622] border border-purple-500/30 p-5 rounded-2xl">
                  <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">Dispatched Redemptions</p>
                  <p className="text-3xl font-black text-purple-300 font-mono mt-1">
                    ${Number(stats?.totalRedeemed || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-[#131622] border border-[#ffd700]/30 p-5 rounded-2xl">
                  <p className="text-xs font-bold text-[#ffd700] uppercase tracking-wider">Net House Margin (NGR)</p>
                  <p className="text-3xl font-black text-gold-gradient font-mono mt-1">
                    ${Number(stats?.netGGR || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="bg-[#131622] border border-blue-500/30 p-5 rounded-2xl">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">Total Patrons</p>
                  <p className="text-3xl font-black text-blue-300 font-mono mt-1">
                    {Number(stats?.totalPlayers || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Action Queues */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#10141e] border border-white/10 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-bold">Pending Deposits</p>
                    <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{stats?.pendingDeposits || 0}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('finance'); setFinanceSubTab('deposits'); }}
                    className="btn-gold text-xs py-1.5 px-3.5"
                  >
                    Review
                  </button>
                </div>

                <div className="bg-[#10141e] border border-white/10 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-bold">Pending Cashouts</p>
                    <p className="text-2xl font-black text-purple-400 font-mono mt-1">{stats?.pendingRedemptions || 0}</p>
                  </div>
                  <button
                    onClick={() => { setActiveTab('finance'); setFinanceSubTab('redemptions'); }}
                    className="btn-gold text-xs py-1.5 px-3.5"
                  >
                    Review
                  </button>
                </div>

                <div className="bg-[#10141e] border border-white/10 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400 font-bold">Pending KYC Verifications</p>
                    <p className="text-2xl font-black text-[#ffd700] font-mono mt-1">{stats?.pendingKyc || 0}</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('kyc')}
                    className="btn-gold text-xs py-1.5 px-3.5"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNT REQUESTS */}
          {activeTab === 'account_requests' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-black font-serif text-white">Player Game Account Requests</h2>
                <p className="text-xs text-gray-400 mt-1">
                  Approve and issue credentials for Juwa, Fire Kirin, Game Vault, Orion Stars, and Sweepstakes platforms
                </p>
              </div>

              <AccountRequestsView
                requests={accountRequests}
                filter={accountReqFilter}
                onFilterChange={(f) => {
                  setAccountReqFilter(f);
                  fetchAccountRequests();
                }}
                onOpenApproveModal={handleOpenApproveModal}
                onCancelRequest={handleCancelRequest}
                onRefresh={() => {
                  fetchAccountRequests();
                  syncRequestsAndAlerts();
                }}
              />

              {/* Modal for Approving & Customizing Random Credentials */}
              {approvalModal.open && approvalModal.request && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-[#101426] border border-[#d4af37]/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div>
                        <h3 className="font-serif font-black text-lg text-white">
                          Fulfill {approvalModal.request.gameTitle}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Player: <strong className="text-white">{approvalModal.request.userName}</strong> ({approvalModal.request.userEmail})
                        </p>
                      </div>
                      <button
                        onClick={() => setApprovalModal({ open: false, request: null, username: '', password: '' })}
                        className="text-gray-400 hover:text-white"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">
                          Game Platform Username
                        </label>
                        <input
                          type="text"
                          value={approvalModal.username}
                          onChange={(e) => setApprovalModal({ ...approvalModal, username: e.target.value })}
                          className="w-full bg-black/60 border border-[#d4af37]/40 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-[#ffd700] outline-none focus:border-[#ffd700]"
                          placeholder="Username"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-300 block mb-1">
                          Game Platform Password
                        </label>
                        <input
                          type="text"
                          value={approvalModal.password}
                          onChange={(e) => setApprovalModal({ ...approvalModal, password: e.target.value })}
                          className="w-full bg-black/60 border border-[#d4af37]/40 rounded-xl px-3.5 py-2.5 text-sm font-mono font-bold text-[#ffd700] outline-none focus:border-[#ffd700]"
                          placeholder="Password"
                          required
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20 text-[11px] text-[#ffd700]">
                        ⚡ Random credentials generated automatically. You can confirm them or type custom ones before issuing to the player.
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setApprovalModal({ open: false, request: null, username: '', password: '' })}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        disabled={submittingApproval}
                        onClick={handleConfirmApproval}
                        className="btn-gold py-2.5 px-5 text-xs font-black uppercase flex items-center gap-2 shadow-lg"
                      >
                        {submittingApproval ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Issuing...</span>
                          </>
                        ) : (
                          <>
                            <Check size={15} />
                            <span>Confirm &amp; Issue Credentials</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: COINS ALLOTMENT */}
          {activeTab === 'coins_allotment' && (
            <CoinOperationsDesk
              accountRequests={accountRequests}
              redemptions={redemptions}
              allotmentPlayers={allotmentPlayers}
              selectedPlayer={selectedPlayer}
              setSelectedPlayer={setSelectedPlayer}
              allotmentSearch={allotmentSearch}
              setAllotmentSearch={setAllotmentSearch}
              allotmentAction={allotmentAction}
              setAllotmentAction={setAllotmentAction}
              allotmentCurrency={allotmentCurrency}
              setAllotmentCurrency={setAllotmentCurrency}
              allotmentAmount={allotmentAmount}
              setAllotmentAmount={setAllotmentAmount}
              allotmentReason={allotmentReason}
              setAllotmentReason={setAllotmentReason}
              allotmentLoading={allotmentLoading}
              allotmentSuccessMsg={allotmentSuccessMsg}
              allotmentErrorMsg={allotmentErrorMsg}
              allotmentHistory={allotmentHistory}
              allotmentLedgerFilter={allotmentLedgerFilter}
              setAllotmentLedgerFilter={setAllotmentLedgerFilter}
              onExecuteAllotment={handleExecuteAllotment}
              onRefresh={() => {
                fetchAllotmentData();
                fetchAccountRequests();
                syncRequestsAndAlerts();
              }}
              onApproveLoad={async (loadId) => {
                const res = await fetch('/api/account-requests', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: loadId, action: 'approve_load' }),
                });
                const d = await res.json();
                if (d.success) {
                  fetchAccountRequests();
                  syncRequestsAndAlerts();
                } else {
                  alert(d.error || 'Failed to approve load');
                }
              }}
              onRejectLoad={async (loadId, reason) => {
                const res = await fetch('/api/account-requests', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: loadId, action: 'reject_load', reason }),
                });
                const d = await res.json();
                if (d.success) {
                  fetchAccountRequests();
                  syncRequestsAndAlerts();
                } else {
                  alert(d.error || 'Failed to reject load');
                }
              }}
              onVerifyCoinCashout={async (redemptionId, action, notes) => {
                const res = await fetch('/api/payments/withdraw', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ redemptionId, action, inspectionNotes: notes }),
                });
                const d = await res.json();
                if (d.success) {
                  syncRequestsAndAlerts();
                } else {
                  alert(d.error || 'Failed to update coin verification status');
                }
              }}
            />
          )}

          {/* TAB 4: GAMES LIBRARY */}
          {activeTab === 'games' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black font-serif text-white">Games Catalog Management</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Manage real games, status switches, thumbnails, and badges across the lobby
                  </p>
                </div>
              </div>

              {/* Add New Game Form */}
              <div className="bg-[#10141e] border border-[#d4af37]/25 p-5 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Plus size={15} className="text-[#ffd700]" />
                  <span>Add New Sweepstakes Game</span>
                </h3>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newGame.title.trim()) return;
                    setIsSavingGame(true);
                    try {
                      const res = await fetch('/api/games', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(newGame),
                      });
                      const d = await res.json();
                      setIsSavingGame(false);
                      if (d.success) {
                        setNewGame({
                          title: '',
                          provider: 'Zorra Royal Studio',
                          thumbnail: '/images/vegas-777.webp',
                          badge: 'HOT',
                          url: '',
                          isActive: true,
                        });
                        fetch('/api/games?all=true').then(r => r.json()).then(g => { if (g.success) setGames(g.games); });
                      } else {
                        alert(d.error || 'Failed to add game');
                      }
                    } catch (err) {
                      setIsSavingGame(false);
                      alert(err.message);
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-300 mb-1 uppercase">Title</label>
                      <input
                        type="text"
                        placeholder="Game Title"
                        value={newGame.title}
                        onChange={(e) => setNewGame({ ...newGame, title: e.target.value })}
                        required
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-300 mb-1 uppercase">Provider</label>
                      <input
                        type="text"
                        placeholder="Provider Name"
                        value={newGame.provider}
                        onChange={(e) => setNewGame({ ...newGame, provider: e.target.value })}
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-300 mb-1 uppercase">Badge</label>
                      <select
                        value={newGame.badge}
                        onChange={(e) => setNewGame({ ...newGame, badge: e.target.value })}
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                      >
                        <option value="HOT">🔥 HOT</option>
                        <option value="NEW">✨ NEW</option>
                        <option value="POPULAR">⭐ POPULAR</option>
                        <option value="EXCLUSIVE">💎 EXCLUSIVE</option>
                        <option value="">No Badge</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-300 mb-1 uppercase">Cover Image</label>
                      <div className="flex items-center gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 border border-white/15 hover:border-[#ffd700] rounded-xl cursor-pointer text-xs font-bold text-[#ffd700] hover:text-white transition">
                          <Upload size={14} />
                          <span>Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleGameImageFile(file, (dataUrl) => setNewGame({ ...newGame, thumbnail: dataUrl }));
                            }}
                            className="hidden"
                          />
                        </label>
                        {newGame.thumbnail && (
                          <div className="w-9 h-9 rounded-lg overflow-hidden border border-[#ffd700]/40 bg-black/40 shrink-0">
                            <img src={newGame.thumbnail} alt="Cover Preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-300 mb-1 uppercase">Launch URL (Optional)</label>
                      <input
                        type="text"
                        placeholder="https://... (Optional)"
                        value={newGame.url}
                        onChange={(e) => setNewGame({ ...newGame, url: e.target.value })}
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewGame({ ...newGame, isActive: !newGame.isActive })}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition ${
                          newGame.isActive
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                            : 'bg-red-500/15 border-red-500/40 text-red-400'
                        }`}
                      >
                        Status: {newGame.isActive ? 'Active' : 'Hidden'}
                      </button>

                      <button
                        type="submit"
                        disabled={isSavingGame}
                        className="btn-gold py-2 px-4 text-xs font-black uppercase"
                      >
                        {isSavingGame ? 'Saving...' : 'Add Game'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Games Table */}
              <div className="bg-[#10141e] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 bg-[#07080b] border-b border-white/5 flex items-center justify-between">
                  <span className="text-xs font-black text-white uppercase tracking-wider">All Catalog Games ({games.length})</span>
                  <span className="text-[11px] text-gray-400">Click switch to toggle ON/OFF</span>
                </div>

                {/* Desktop Games Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#07080b] text-gray-400 uppercase border-b border-white/5 font-bold">
                      <tr>
                        <th className="p-3 w-16">Cover</th>
                        <th className="p-3">Title &amp; Provider</th>
                        <th className="p-3">Badge</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {games.map(g => {
                        const isOnline = g.isActive !== false;
                        return (
                          <tr key={g.id || g._id} className="hover:bg-white/[0.02]">
                            <td className="p-3">
                              <div className="w-12 h-9 rounded-lg overflow-hidden border border-white/10 bg-black/50">
                                <img
                                  src={g.thumbnail || '/images/vegas-777.webp'}
                                  alt={g.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-white">{g.title}</div>
                              <div className="text-[11px] text-gray-400">{g.provider || 'Zorra Royal Studio'}</div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/30">
                                {g.badge || 'STANDARD'}
                              </span>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={async () => {
                                  const updated = !isOnline;
                                  await fetch('/api/games', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ id: g.id || g._id, isActive: updated }),
                                  });
                                  setGames(games.map(x => (x.id === g.id || x._id === g._id) ? { ...x, isActive: updated } : x));
                                }}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black border transition ${
                                  isOnline
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                    : 'bg-red-500/20 text-red-400 border-red-500/40'
                                }`}
                              >
                                {isOnline ? 'Active (ON)' : 'Hidden (OFF)'}
                              </button>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setEditGameModal({
                                    open: true,
                                    data: {
                                      id: g.id || g._id,
                                      title: g.title || '',
                                      provider: g.provider || 'Zorra Royal Studio',
                                      thumbnail: g.thumbnail || g.image || '/images/vegas-777.webp',
                                      badge: g.badge || 'HOT',
                                      url: g.url || '',
                                      category: g.category || 'slots',
                                      isActive: g.isActive !== false,
                                    },
                                    saving: false,
                                  })}
                                  className="p-1.5 rounded-lg bg-[#ffd700]/15 text-[#ffd700] hover:bg-[#ffd700]/25 border border-[#ffd700]/30 transition"
                                  title="Edit Game"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Delete game "${g.title}"?`)) return;
                                    await fetch(`/api/games?id=${encodeURIComponent(g.id || g._id)}`, { method: 'DELETE' });
                                    setGames(games.filter(x => (x.id !== g.id && x._id !== g._id)));
                                  }}
                                  className="p-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 transition"
                                  title="Delete Game"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Games Cards */}
                <div className="block sm:hidden divide-y divide-white/5">
                  {games.map(g => {
                    const isOnline = g.isActive !== false;
                    return (
                      <div key={g.id || g._id} className="p-3.5 space-y-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-11 rounded-lg overflow-hidden border border-white/10 bg-black/50 shrink-0">
                            <img
                              src={g.thumbnail || '/images/vegas-777.webp'}
                              alt={g.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-white text-xs truncate">{g.title}</div>
                            <div className="text-[10px] text-gray-400">{g.provider || 'Zorra Royal Studio'}</div>
                            <div className="mt-1">
                              <span className="px-2 py-0.5 rounded text-[9px] font-black bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/30">
                                {g.badge || 'STANDARD'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 gap-2">
                          <button
                            onClick={async () => {
                              const updated = !isOnline;
                              await fetch('/api/games', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: g.id || g._id, isActive: updated }),
                              });
                              setGames(games.map(x => (x.id === g.id || x._id === g._id) ? { ...x, isActive: updated } : x));
                            }}
                            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black border transition text-center ${
                              isOnline
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                : 'bg-red-500/20 text-red-400 border-red-500/40'
                            }`}
                          >
                            {isOnline ? 'Active (ON)' : 'Hidden (OFF)'}
                          </button>

                          <button
                            onClick={() => setEditGameModal({
                              open: true,
                              data: {
                                id: g.id || g._id,
                                title: g.title || '',
                                provider: g.provider || 'Zorra Royal Studio',
                                thumbnail: g.thumbnail || g.image || '/images/vegas-777.webp',
                                badge: g.badge || 'HOT',
                                url: g.url || '',
                                category: g.category || 'slots',
                                isActive: g.isActive !== false,
                              },
                              saving: false,
                            })}
                            className="p-2 rounded-xl bg-[#ffd700]/15 text-[#ffd700] hover:bg-[#ffd700]/25 border border-[#ffd700]/30 transition shrink-0"
                            title="Edit Game"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={async () => {
                              if (!confirm(`Delete game "${g.title}"?`)) return;
                              await fetch(`/api/games?id=${encodeURIComponent(g.id || g._id)}`, { method: 'DELETE' });
                              setGames(games.filter(x => (x.id !== g.id && x._id !== g._id)));
                            }}
                            className="p-2 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 transition shrink-0"
                            title="Delete Game"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PLAYER ACCOUNTS (Patron 360) */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black font-serif text-white">Player Accounts Directory</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Manage patron dossier, single USD balance, cashout history, and 360° profile inspection
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#131622] border border-[#d4af37]/25 rounded-xl w-64">
                    <Search size={14} className="text-gray-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search username or email..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          fetch(`/api/users?search=${encodeURIComponent(userSearchQuery)}`)
                            .then(r => r.json())
                            .then(d => { if (d.success) setUsersList(d.users || []); });
                        }
                      }}
                      className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      fetch(`/api/users?search=${encodeURIComponent(userSearchQuery)}`)
                        .then(r => r.json())
                        .then(d => { if (d.success) setUsersList(d.users || []); });
                    }}
                    className="btn-gold text-xs py-2 px-3.5"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'All Patrons', count: usersList.length },
                  { id: 'active', label: 'Active', count: usersList.filter(u => !u.isBanned).length },
                  { id: 'with_balance', label: 'Balance > $0', count: usersList.filter(u => Number(u.balance || u.balanceSC || 0) > 0).length },
                  { id: 'banned', label: 'Banned', count: usersList.filter(u => u.isBanned).length },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setPatronFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      patronFilter === f.id
                        ? 'bg-[#ffd700] text-black shadow-md'
                        : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                    }`}
                  >
                    <span>{f.label}</span>
                    <span className="text-[10px] opacity-80">({f.count})</span>
                  </button>
                ))}
              </div>

              {/* Users Table */}
              <div className="bg-[#10141e] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                {/* Desktop View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#07080b] text-gray-400 uppercase border-b border-white/5 font-bold">
                      <tr>
                        <th className="p-3">Patron</th>
                        <th className="p-3">Wallet Balance ($ USD)</th>
                        <th className="p-3">Total Deposits</th>
                        <th className="p-3">Total Cashouts</th>
                        <th className="p-3">KYC Status</th>
                        <th className="p-3">Account Status</th>
                        <th className="p-3 text-right">360° Profile</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {usersList
                        .filter(u => {
                          if (patronFilter === 'active') return !u.isBanned;
                          if (patronFilter === 'banned') return u.isBanned;
                          if (patronFilter === 'with_balance') return Number(u.balance || u.balanceSC || 0) > 0;
                          return true;
                        })
                        .map(u => (
                          <tr key={u.id || u._id} className="hover:bg-white/[0.02]">
                            <td className="p-3">
                              <div className="font-bold text-white">{u.username}</div>
                              <div className="text-[11px] text-gray-400">{u.email}</div>
                            </td>
                            <td className="p-3 font-mono font-bold text-[#ffd700]">
                              ${Number(u.balance || u.balanceSC || 0).toFixed(2)} USD
                            </td>
                            <td className="p-3 font-mono text-emerald-400">
                              ${Number(u.totalDeposits || 0).toFixed(2)}
                            </td>
                            <td className="p-3 font-mono text-purple-400">
                              ${Number(u.totalWithdrawals || 0).toFixed(2)}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                u.kycStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {u.kycStatus || 'unverified'}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                u.isBanned ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {u.isBanned ? 'Banned' : 'Active'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setEditPatronModal({
                                    open: true,
                                    data: {
                                      id: u.id || u._id,
                                      username: u.username || '',
                                      email: u.email || '',
                                      kycStatus: u.kycStatus || 'unverified',
                                      isBanned: Boolean(u.isBanned),
                                      banReason: u.banReason || '',
                                      newPassword: '',
                                    },
                                    saving: false,
                                  })}
                                  className="px-2.5 py-1.5 rounded-xl bg-[#ffd700]/15 hover:bg-[#ffd700]/25 text-[#ffd700] text-xs font-bold border border-[#ffd700]/30 transition flex items-center gap-1"
                                >
                                  <Edit2 size={12} /> Edit
                                </button>
                                <button
                                  onClick={() => setSelectedPatronId(u.id || u._id)}
                                  className="btn-gold py-1.5 px-3 text-xs font-bold"
                                >
                                  Inspect 360°
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="block sm:hidden divide-y divide-white/5">
                  {usersList
                    .filter(u => {
                      if (patronFilter === 'active') return !u.isBanned;
                      if (patronFilter === 'banned') return u.isBanned;
                      if (patronFilter === 'with_balance') return Number(u.balance || u.balanceSC || 0) > 0;
                      return true;
                    })
                    .map(u => (
                      <div key={u.id || u._id} className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white text-sm">{u.username}</div>
                            <div className="text-[11px] text-gray-400">{u.email}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.isBanned ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {u.isBanned ? 'Banned' : 'Active'}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/40 border border-white/5 text-center">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-gray-400 block">Balance</span>
                            <span className="font-mono font-bold text-[#ffd700] text-xs">
                              ${Number(u.balance || u.balanceSC || 0).toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-gray-400 block">Deposits</span>
                            <span className="font-mono text-emerald-400 text-xs">
                              ${Number(u.totalDeposits || 0).toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold text-gray-400 block">Cashouts</span>
                            <span className="font-mono text-purple-400 text-xs">
                              ${Number(u.totalWithdrawals || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            u.kycStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            KYC: {u.kycStatus || 'unverified'}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditPatronModal({
                                open: true,
                                data: {
                                  id: u.id || u._id,
                                  username: u.username || '',
                                  email: u.email || '',
                                  kycStatus: u.kycStatus || 'unverified',
                                  isBanned: Boolean(u.isBanned),
                                  banReason: u.banReason || '',
                                  newPassword: '',
                                },
                                saving: false,
                              })}
                              className="px-2.5 py-1.5 rounded-xl bg-[#ffd700]/15 hover:bg-[#ffd700]/25 text-xs font-bold text-[#ffd700] border border-[#ffd700]/30 transition flex items-center gap-1"
                            >
                              <Edit2 size={12} /> Edit
                            </button>
                            <button
                              onClick={() => setSelectedPatronId(u.id || u._id)}
                              className="btn-gold py-1.5 px-3.5 text-xs font-bold"
                            >
                              Inspect 360°
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: FINANCE & PAYMENTS */}
          {activeTab === 'finance' && (
            <FinanceUnifiedDesk
              deposits={deposits}
              redemptions={redemptions}
              paymentMethods={paymentMethods}
              customDepositSC={customDepositSC}
              setCustomDepositSC={setCustomDepositSC}
              isRefreshing={refreshingFinance}
              onRefresh={() => {
                setRefreshingFinance(true);
                syncRequestsAndAlerts().finally(() => setRefreshingFinance(false));
              }}
              onApproveDeposit={async (depositId, scToCredit) => {
                const res = await fetch('/api/payments/deposit', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ depositId, action: 'approve', customSC: Number(scToCredit) }),
                });
                const data = await res.json();
                if (data.success) {
                  setDeposits((prev) =>
                    prev.map((item) =>
                      item.id === depositId
                        ? { ...item, status: 'approved', creditedSC: Number(scToCredit) }
                        : item
                    )
                  );
                  syncRequestsAndAlerts();
                } else {
                  alert(data.error || 'Failed to approve deposit');
                }
              }}
              onRejectDeposit={async (depositId, reason) => {
                const res = await fetch('/api/payments/deposit', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ depositId, action: 'reject', rejectReason: reason }),
                });
                const data = await res.json();
                if (data.success) {
                  setDeposits((prev) =>
                    prev.map((item) => (item.id === depositId ? { ...item, status: 'rejected' } : item))
                  );
                  syncRequestsAndAlerts();
                } else {
                  alert(data.error || 'Failed to reject deposit');
                }
              }}
              onApproveRedemption={async (redemptionId) => {
                const res = await fetch('/api/payments/withdraw', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ redemptionId, action: 'approve' }),
                });
                const data = await res.json();
                if (data.success) {
                  setRedemptions((prev) =>
                    prev.map((item) =>
                      item.id === redemptionId ? { ...item, status: 'approved' } : item
                    )
                  );
                  syncRequestsAndAlerts();
                } else {
                  alert(data.error || 'Failed to approve cashout');
                }
              }}
              onRejectRedemption={async (redemptionId, reason) => {
                const res = await fetch('/api/payments/withdraw', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ redemptionId, action: 'reject', reason }),
                });
                const data = await res.json();
                if (data.success) {
                  setRedemptions((prev) =>
                    prev.map((item) =>
                      item.id === redemptionId ? { ...item, status: 'rejected' } : item
                    )
                  );
                  syncRequestsAndAlerts();
                } else {
                  alert(data.error || 'Failed to reject cashout');
                }
              }}
            />
          )}

          {/* TAB 7: PAYMENT GATEWAYS */}
          {activeTab === 'gateways' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black font-serif text-white">Deposit Payment Gateways</h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Manage payment destinations (CashApp, PayPal, Venmo, Zelle, Crypto, Chime) with QR codes
                  </p>
                </div>
              </div>

              {/* Add Gateway Form */}
              <div className="bg-[#10141e] border border-[#d4af37]/25 p-5 rounded-2xl shadow-xl space-y-4">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Plus size={15} className="text-[#ffd700]" />
                  <span>Add New Payment Gateway</span>
                </h3>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newMethod.name.trim()) return;
                    const res = await fetch('/api/payments/methods', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newMethod),
                    });
                    const d = await res.json();
                    if (d.success) {
                      setNewMethod({
                        name: '',
                        type: 'cashapp',
                        tag: 'Instant',
                        accountDetails: '',
                        paymentUrl: '',
                        qrCode: '',
                        instructions: '',
                        minDeposit: 10,
                        maxDeposit: 2500,
                      });
                      fetch('/api/payments/methods?all=true').then(r => r.json()).then(m => { if (m.success) setPaymentMethods(m.methods || []); });
                    } else {
                      alert(d.error || 'Failed to create payment method');
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-300 mb-1 uppercase">Method Name</label>
                      <input
                        type="text"
                        placeholder="e.g. VIP Cash App"
                        value={newMethod.name}
                        onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
                        required
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-300 mb-1 uppercase">Type</label>
                      <select
                        value={newMethod.type}
                        onChange={(e) => setNewMethod({ ...newMethod, type: e.target.value })}
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                      >
                        <option value="cashapp">Cash App</option>
                        <option value="paypal">PayPal</option>
                        <option value="venmo">Venmo</option>
                        <option value="zelle">Zelle</option>
                        <option value="crypto">Cryptocurrency (BTC/ETH/USDT)</option>
                        <option value="chime">Chime</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-300 mb-1 uppercase">Cashtag / Account Handle</label>
                      <input
                        type="text"
                        placeholder="$cashtag, email, or wallet"
                        value={newMethod.accountDetails}
                        onChange={(e) => setNewMethod({ ...newMethod, accountDetails: e.target.value })}
                        required
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-300 mb-1 uppercase">Direct Payment URL</label>
                      <input
                        type="text"
                        placeholder="https://cash.app/$... (Optional)"
                        value={newMethod.paymentUrl}
                        onChange={(e) => setNewMethod({ ...newMethod, paymentUrl: e.target.value })}
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-gray-300 mb-1 uppercase">Instructions for Player</label>
                      <input
                        type="text"
                        placeholder="Include your Zorra Royals username in the note!"
                        value={newMethod.instructions}
                        onChange={(e) => setNewMethod({ ...newMethod, instructions: e.target.value })}
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-300 mb-1 uppercase">QR Code Image</label>
                      <label className="flex items-center justify-center gap-2 px-3 py-2 bg-white/5 border border-white/15 hover:border-[#ffd700] rounded-xl cursor-pointer text-xs font-bold text-[#ffd700] hover:text-white transition">
                        <Upload size={14} />
                        <span>Upload QR</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = () => setNewMethod({ ...newMethod, qrCode: r.result });
                              r.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="btn-gold py-2 px-4 text-xs font-black uppercase"
                    >
                      Save Gateway
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Gateways */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paymentMethods.map(m => (
                  <div key={m.id || m._id} className="bg-[#10141e] border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white text-sm">{m.name}</p>
                        <p className="text-[10px] text-[#ffd700] font-mono uppercase">{m.type}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        m.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {m.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <div className="p-3 bg-[#07080b] rounded-xl border border-white/5 space-y-1">
                      <p className="text-[10px] text-gray-400 uppercase font-mono">Account / Cashtag:</p>
                      <p className="text-xs font-mono font-bold text-[#ffd700] break-all">{m.accountDetails}</p>
                    </div>

                    {m.qrCode && (
                      <div className="w-20 h-20 mx-auto rounded-lg overflow-hidden border border-white/10 bg-white p-1">
                        <img src={m.qrCode} alt="QR Code" className="w-full h-full object-contain" />
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <button
                        onClick={async () => {
                          const updated = !m.isActive;
                          await fetch('/api/payments/methods', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: m.id || m._id, isActive: updated }),
                          });
                          setPaymentMethods(paymentMethods.map(x => (x.id === m.id || x._id === m._id) ? { ...x, isActive: updated } : x));
                        }}
                        className="text-xs font-bold text-gray-300 hover:text-white"
                      >
                        {m.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditGatewayModal({
                            open: true,
                            data: {
                              id: m.id || m._id,
                              name: m.name || '',
                              type: m.type || 'cashapp',
                              tag: m.tag || 'Instant',
                              accountDetails: m.accountDetails || '',
                              paymentUrl: m.paymentUrl || '',
                              qrCode: m.qrCode || '',
                              instructions: m.instructions || '',
                              minDeposit: m.minDeposit || 10,
                              maxDeposit: m.maxDeposit || 5000,
                              isActive: m.isActive !== false,
                            },
                            saving: false,
                          })}
                          className="text-xs font-bold text-[#ffd700] hover:text-white flex items-center gap-1 bg-[#ffd700]/10 hover:bg-[#ffd700]/20 px-2.5 py-1 rounded-lg border border-[#ffd700]/30 transition"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete ${m.name}?`)) return;
                            await fetch(`/api/payments/methods?id=${encodeURIComponent(m.id || m._id)}`, { method: 'DELETE' });
                            setPaymentMethods(paymentMethods.filter(x => (x.id !== m.id && x._id !== m._id)));
                          }}
                          className="text-xs font-bold text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: TRANSACTIONS LOG */}
          {activeTab === 'tx_search' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black font-serif text-white">Audit &amp; Financial Ledger</h2>
                  <p className="text-xs text-gray-400 mt-1">Real-time tamper-evident transactions log</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Filter by username..."
                    value={ledgerFilterUser}
                    onChange={(e) => setLedgerFilterUser(e.target.value)}
                    className="bg-[#10141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#ffd700]"
                  />
                  <select
                    value={ledgerFilterType}
                    onChange={(e) => setLedgerFilterType(e.target.value)}
                    className="bg-[#10141e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#ffd700]"
                  >
                    <option value="all">All Types</option>
                    <option value="deposit">Deposits</option>
                    <option value="redemption">Redemptions</option>
                    <option value="coin_load">Game Loads</option>
                    <option value="admin_adjustment">Staff Adjustments</option>
                  </select>
                </div>
              </div>

              <div className="bg-[#10141e] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                {/* Desktop View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#07080b] text-gray-400 uppercase border-b border-white/5 font-bold">
                      <tr>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Player</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Amount ($ USD)</th>
                        <th className="p-3">Status</th>
                        <th className="p-3">Details / Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ledgerRecords.map(r => (
                        <tr key={r.id || r._id} className="hover:bg-white/[0.02]">
                          <td className="p-3 font-mono text-gray-400 whitespace-nowrap">
                            {new Date(r.createdAt).toLocaleString()}
                          </td>
                          <td className="p-3 font-bold text-white">{r.username}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-gray-300">
                              {r.type}
                            </span>
                          </td>
                          <td className="p-3 font-mono font-bold text-[#ffd700]">
                            ${Number(r.amount || 0).toFixed(2)}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              r.status === 'approved' || r.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : r.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {r.status || 'completed'}
                            </span>
                          </td>
                          <td className="p-3 text-gray-400">{r.notes || r.reason || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="block sm:hidden divide-y divide-white/5">
                  {ledgerRecords.map(r => (
                    <div key={r.id || r._id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{r.username}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.status === 'approved' || r.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : r.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {r.status || 'completed'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/10 text-gray-300">
                          {r.type}
                        </span>
                        <span className="font-mono font-black text-[#ffd700] text-sm">
                          ${Number(r.amount || 0).toFixed(2)} USD
                        </span>
                      </div>

                      <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1">
                        <span>{new Date(r.createdAt).toLocaleString()}</span>
                        {r.notes || r.reason ? (
                          <span className="text-gray-300 truncate max-w-[150px]">{r.notes || r.reason}</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: LIVE CHAT SUPPORT (WhatsApp-Style Responsive Workspace) */}
          {activeTab === 'chat' && (() => {
            const formatChatTime = (dateStr) => {
              if (!dateStr) return '';
              const d = new Date(dateStr);
              const now = new Date();
              const diffMs = now - d;
              const diffMins = Math.floor(diffMs / 60000);
              if (diffMins < 1) return 'Just now';
              if (diffMins < 60) return `${diffMins}m ago`;
              const diffHours = Math.floor(diffMins / 60);
              if (diffHours < 24) return `${diffHours}h ago`;
              return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
            };

            const totalUnreadChat = chatConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

            const filteredChatConvs = chatConversations.filter(c => {
              const q = chatSearchQuery.trim().toLowerCase();
              const matchesSearch = !q ||
                (c.username && c.username.toLowerCase().includes(q)) ||
                (c.lastMessage && c.lastMessage.toLowerCase().includes(q));
              if (chatFilterTab === 'unread') {
                return matchesSearch && ((c.unreadCount || 0) > 0);
              }
              return matchesSearch;
            });

            const cannedReplies = [
              "👋 Hello! How may Zorra Royals Concierge assist you today?",
              "✅ Your deposit has been confirmed and credited to your wallet!",
              "⏳ Your withdrawal request is currently being reviewed by finance.",
              "📸 Please provide a clear screenshot receipt of your transfer.",
              "🎉 A VIP loyalty bonus has been awarded to your account!",
            ];

            const handleAdminChatFileChange = (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!file.type.startsWith('image/')) {
                alert('Please select an image file (PNG, JPG, WEBP).');
                return;
              }
              setIsUploadingChatImage(true);
              const reader = new FileReader();
              reader.onload = (event) => {
                const img = new window.Image();
                img.onload = () => {
                  const maxDim = 1200;
                  let w = img.width;
                  let h = img.height;
                  if (w > maxDim || h > maxDim) {
                    if (w > h) {
                      h = Math.round((h * maxDim) / w);
                      w = maxDim;
                    } else {
                      w = Math.round((w * maxDim) / h);
                      h = maxDim;
                    }
                  }
                  const canvas = document.createElement('canvas');
                  canvas.width = w;
                  canvas.height = h;
                  const ctx = canvas.getContext('2d');
                  ctx.drawImage(img, 0, 0, w, h);
                  const compressed = canvas.toDataURL('image/jpeg', 0.82);
                  setChatAttachedImage(compressed);
                  setIsUploadingChatImage(false);
                };
                img.src = event.target.result;
              };
              reader.readAsDataURL(file);
              e.target.value = '';
            };

            const handleSendChatMessage = async (e, directText) => {
              if (e && e.preventDefault) e.preventDefault();
              const text = (directText !== undefined ? directText : chatReplyText).trim();
              const imagePayload = chatAttachedImage;
              if ((!text && !imagePayload) || !activeChatConv || isSendingChat) return;

              setIsSendingChat(true);
              const optimisticMsg = {
                id: `temp_${Date.now()}`,
                conversationId: activeChatConv._id,
                userId: activeChatConv.userId,
                username: user?.username || 'Zorra Royals Support',
                senderRole: 'staff',
                text: text,
                imageUrl: imagePayload,
                read: true,
                createdAt: new Date().toISOString(),
              };
              setChatMessages(prev => [...prev, optimisticMsg]);
              setChatReplyText('');
              setChatAttachedImage(null);

              try {
                await fetch('/api/chat', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    conversationId: activeChatConv._id,
                    targetUserId: activeChatConv.userId,
                    targetUsername: activeChatConv.username,
                    text: text,
                    imageUrl: imagePayload,
                    isStaffReply: true,
                  }),
                });
                const res = await fetch(`/api/chat?conversationId=${activeChatConv._id}`);
                const d = await res.json();
                if (d.success) setChatMessages(d.messages);
                const cRes = await fetch('/api/chat?inbox=true');
                const cD = await cRes.json();
                if (cD.success) setChatConversations(cD.conversations);
              } catch (err) {
                console.error('Failed to send chat message:', err);
              } finally {
                setIsSendingChat(false);
              }
            };

            return (
              <div
                className="flex-1 h-full min-h-0 flex flex-col space-y-3"
                style={{ fontFamily: 'Lexend, -apple-system, sans-serif' }}
              >
                {/* Top Luxury Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500/25 via-purple-600/30 to-amber-500/20 border border-[#ffd700]/40 flex items-center justify-center text-[#ffd700] shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                      <Headphones size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                          Live Support Concierge
                        </h2>
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          Live Socket Desk
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        24/7 Real-Time VIP Player Inquiries & Hospitality Assistance
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-xs font-bold text-amber-300">
                      <ShieldCheck size={14} className="text-amber-400" />
                      <span>Strict Compliance: Immutable Chat Audit</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        fetch('/api/chat?inbox=true').then(r => r.json()).then(d => { if (d.success) setChatConversations(d.conversations); });
                        if (activeChatConv) {
                          fetch(`/api/chat?conversationId=${activeChatConv._id}`).then(r => r.json()).then(d => { if (d.success) setChatMessages(d.messages); });
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white flex items-center gap-1.5 text-xs font-bold transition"
                      title="Refresh Inbox"
                    >
                      <RefreshCw size={13} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Main Chat Workspace */}
                <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3 overflow-hidden relative">
                  {/* Left: Active Inquiries List */}
                  <div className={`${activeChatConv ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 h-full bg-gradient-to-b from-[#141824]/90 to-[#07080b]/90 border border-white/10 rounded-2xl flex-col overflow-hidden shadow-2xl backdrop-blur-xl shrink-0`}>
                    {/* Inbox Header & Search */}
                    <div className="p-3.5 border-b border-white/10 space-y-3 bg-[#0d1017]/70">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare size={15} className="text-[#ffd700]" />
                          <span className="text-xs font-black uppercase tracking-wider text-white">
                            Active Inquiries
                          </span>
                        </div>
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/30">
                          {chatConversations.length} Open
                        </span>
                      </div>

                      {/* Search Bar */}
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={chatSearchQuery}
                          onChange={(e) => setChatSearchQuery(e.target.value)}
                          placeholder="Search player or keyword..."
                          className="w-full bg-[#10141e] border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#ffd700]/80 transition"
                        />
                        {chatSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setChatSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      {/* Filter Tabs */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setChatFilterTab('all')}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold text-center transition ${chatFilterTab === 'all'
                            ? 'bg-[#ffd700]/25 text-[#ffd700] border border-[#ffd700]/50 shadow-sm'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                          All ({chatConversations.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setChatFilterTab('unread')}
                          className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold text-center transition flex items-center justify-center gap-1.5 ${chatFilterTab === 'unread'
                            ? 'bg-red-500/25 text-red-300 border border-red-400/50 shadow-sm'
                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                          <span>Unread</span>
                          {totalUnreadChat > 0 && (
                            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                              {totalUnreadChat}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* List of Conversations */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 divide-y divide-white/[0.04]">
                      {filteredChatConvs.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center text-gray-500">
                          <MessageSquare size={32} className="text-gray-600 mb-2" />
                          <p className="text-xs font-bold text-gray-400">No inquiries found</p>
                          <p className="text-[11px] text-gray-600 mt-0.5">
                            {chatSearchQuery ? 'Try clearing your search query' : 'Queue is clear. No pending inquiries.'}
                          </p>
                        </div>
                      ) : (
                        filteredChatConvs.map((c) => {
                          const isSelected = activeChatConv?._id === c._id;
                          const hasUnread = (c.unreadCount || 0) > 0;
                          return (
                            <div
                              key={c._id}
                              onClick={() => setActiveChatConv(c)}
                              className={`p-3 rounded-xl cursor-pointer transition-all duration-200 border ${isSelected
                                ? 'bg-gradient-to-r from-cyan-950/60 via-[#1a2030] to-[#121622] border-[#ffd700]/60 shadow-[0_0_15px_rgba(212,175,55,0.15)] ring-1 ring-[#ffd700]/30'
                                : hasUnread
                                  ? 'bg-[#1b1a2e]/70 hover:bg-[#241f3d] border-red-500/30'
                                  : 'bg-white/[0.02] hover:bg-white/[0.06] border-transparent'
                                }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600/40 via-cyan-500/20 to-amber-500/20 border border-white/20 flex items-center justify-center text-white font-black text-sm uppercase shadow-sm">
                                    {c.username ? c.username.charAt(0) : 'P'}
                                  </div>
                                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#10141e]" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className={`text-xs font-black truncate ${isSelected ? 'text-[#ffd700]' : 'text-white'}`}>
                                      {c.username || 'Anonymous'}
                                    </span>
                                    <span className="text-[10px] text-gray-500 shrink-0 font-medium">
                                      {formatChatTime(c.updatedAt)}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-400 truncate leading-tight">
                                    {c.lastSenderRole === 'staff' ? (
                                      <span className="text-[#ffd700] font-semibold">You: </span>
                                    ) : null}
                                    {c.lastMessage || 'Active inquiry'}
                                  </p>
                                </div>

                                {/* Unread Pill */}
                                {hasUnread && (
                                  <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-red-500 text-white font-black text-[9px] shadow-sm animate-pulse">
                                    {c.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Right: Active Chat View OR Concierge Welcome Hub */}
                  <div className={`${activeChatConv ? 'flex' : 'hidden md:flex'} flex-1 h-full min-h-0 bg-gradient-to-b from-[#141824]/95 to-[#07080b]/95 border border-white/10 rounded-2xl flex-col overflow-hidden shadow-2xl backdrop-blur-xl relative`}>
                    {activeChatConv ? (
                      <>
                        {/* Active Chat Header */}
                        <div className="p-3.5 bg-[#0d1017]/90 border-b border-white/10 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Mobile Back Button */}
                            <button
                              type="button"
                              onClick={() => setActiveChatConv(null)}
                              className="md:hidden px-2.5 py-1.5 rounded-xl bg-[#ffd700]/15 border border-[#ffd700]/30 text-[#ffd700] hover:bg-[#ffd700]/25 flex items-center gap-1 text-xs font-bold transition shrink-0"
                            >
                              <ArrowLeft size={14} />
                              <span>Back</span>
                            </button>

                            <div className="relative shrink-0">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/30 to-purple-600/30 border border-[#ffd700]/40 flex items-center justify-center text-white font-black text-sm uppercase">
                                {activeChatConv.username ? activeChatConv.username.charAt(0) : 'P'}
                              </div>
                              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#10141e]" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-black text-white text-sm truncate">
                                  {activeChatConv.username}
                                </p>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                                  Online
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 font-mono truncate">
                                Player ID: {activeChatConv.userId}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons in Header */}
                          <div className="flex items-center gap-2 shrink-0">
                            {activeChatConv.userId && (
                              <button
                                type="button"
                                onClick={() => setSelectedPlayerId(activeChatConv.userId)}
                                className="px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/35 text-purple-300 hover:bg-purple-500/25 flex items-center gap-1.5 text-xs font-bold transition shadow-sm"
                                title="Open Player Profile"
                              >
                                <User size={13} />
                                <span className="hidden sm:inline">Player Profile</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                fetch(`/api/chat?conversationId=${activeChatConv._id}`).then(r => r.json()).then(d => { if (d.success) setChatMessages(d.messages); });
                              }}
                              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white transition"
                              title="Refresh Chat"
                            >
                              <RefreshCw size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveChatConv(null)}
                              className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 hover:text-red-300 border border-white/10 text-gray-400 transition hidden md:block"
                              title="Close Chat"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Chat Messages Stream */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#07080b]/60">
                          {/* Session Notice */}
                          <div className="flex items-center justify-center my-1">
                            <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[10px] text-gray-400 font-medium flex items-center gap-1.5">
                              <ShieldCheck size={12} className="text-[#ffd700]" />
                              Immutable Zorra Royals Support Session
                            </span>
                          </div>

                          {chatMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 text-xs text-center py-12">
                              <MessageSquare size={32} className="text-gray-600 mb-2" />
                              <p className="font-bold text-gray-400">No messages in this inquiry yet.</p>
                              <p className="text-[11px] text-gray-600 mt-1">
                                Send a message or choose a quick response below.
                              </p>
                            </div>
                          ) : (
                            chatMessages.map((m) => {
                              const isStaff = m.senderRole === 'staff';
                              return (
                                <div
                                  key={m.id}
                                  className={`flex flex-col ${isStaff ? 'items-end' : 'items-start'}`}
                                >
                                  <div className={`flex items-start gap-2 max-w-[85%] sm:max-w-[75%] ${isStaff ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar icon */}
                                    <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-black uppercase mt-1 border shadow-sm">
                                      {isStaff ? (
                                        <div className="w-full h-full rounded-lg bg-gradient-to-tr from-cyan-400 to-cyan-600 text-black flex items-center justify-center font-black">
                                          V1
                                        </div>
                                      ) : (
                                        <div className="w-full h-full rounded-lg bg-gradient-to-tr from-purple-600/50 to-pink-600/40 text-purple-200 border-white/20 flex items-center justify-center font-black">
                                          {m.username ? m.username.charAt(0) : 'P'}
                                        </div>
                                      )}
                                    </div>

                                    {/* Bubble */}
                                    <div>
                                      {m.imageUrl && (
                                        <div className="mb-2 rounded-xl overflow-hidden border border-white/20 relative group max-w-xs shadow-md">
                                          <img
                                            src={m.imageUrl}
                                            alt="Attachment"
                                            className="w-full max-h-52 object-cover rounded-xl cursor-pointer hover:opacity-95 transition"
                                            onClick={() => setAdminChatPreviewImage(m.imageUrl)}
                                          />
                                          <div
                                            onClick={() => setAdminChatPreviewImage(m.imageUrl)}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 cursor-pointer"
                                          >
                                            <span className="px-2 py-1 rounded bg-black/80 text-white text-[10px] font-bold flex items-center gap-1">
                                              <Eye size={12} /> View Full Size
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                      {m.text && (
                                        <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-lg ${isStaff
                                          ? 'bg-gradient-to-r from-cyan-500 to-cyan-400 text-slate-950 font-semibold rounded-tr-none shadow-[0_4px_15px_rgba(0,240,255,0.2)]'
                                          : 'bg-[#181238] text-gray-100 border border-white/10 rounded-tl-none shadow-md'
                                          }`}>
                                          {m.text}
                                        </div>
                                      )}
                                      <div className={`flex items-center gap-1.5 mt-1 text-[10px] text-gray-500 font-mono ${isStaff ? 'justify-end' : 'justify-start'}`}>
                                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        {isStaff && (
                                          <span className="text-[#ffd700] font-bold flex items-center gap-0.5">
                                            <CheckCheck size={12} />
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                          <div ref={chatMessagesEndRef} />
                        </div>

                        {/* Canned Quick Replies */}
                        <div className="px-3.5 py-2 bg-[#09071c] border-t border-white/5 overflow-x-auto flex items-center gap-2 no-scrollbar">
                          <span className="text-[10px] font-black uppercase text-gray-400 shrink-0 flex items-center gap-1">
                            <Sparkles size={11} className="text-amber-400" /> Quick Replies:
                          </span>
                          {cannedReplies.map((reply, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSendChatMessage(null, reply)}
                              disabled={isSendingChat}
                              className="shrink-0 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-cyan-500/20 border border-white/10 hover:border-[#ffd700]/40 text-gray-300 hover:text-cyan-200 text-[11px] font-medium transition active:scale-95 disabled:opacity-50"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>

                        {/* Pending Image Attachment in Admin */}
                        {chatAttachedImage && (
                          <div className="px-3 py-2 bg-[#0c0e17] border-t border-[#ffd700]/30 flex items-center justify-between gap-2 shrink-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={chatAttachedImage}
                                alt="Attachment preview"
                                className="w-10 h-10 rounded-lg object-cover border border-[#ffd700] shrink-0"
                              />
                              <span className="text-xs text-[#ffd700] font-bold truncate">
                                📷 Screenshot attached for {activeChatConv.username}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setChatAttachedImage(null)}
                              className="p-1 rounded-lg text-gray-400 hover:text-red-400 transition"
                              title="Remove attachment"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}

                        {/* Hidden Admin Chat File Input */}
                        <input
                          type="file"
                          accept="image/*"
                          ref={adminChatFileInputRef}
                          className="hidden"
                          onChange={handleAdminChatFileChange}
                        />

                        {/* Reply Input Form */}
                        <form
                          onSubmit={handleSendChatMessage}
                          style={{
                            paddingBottom: adminChatKeyboardOffset > 0 ? `${adminChatKeyboardOffset + 10}px` : undefined,
                          }}
                          className="p-3 bg-[#0d1017] border-t border-white/10 flex items-center gap-2 transition-all duration-150"
                        >
                          <button
                            type="button"
                            onClick={() => adminChatFileInputRef.current?.click()}
                            disabled={isSendingChat || isUploadingChatImage}
                            className="p-2.5 rounded-xl text-gray-400 hover:text-[#ffd700] bg-white/5 hover:bg-white/10 transition shrink-0 cursor-pointer disabled:opacity-40"
                            title="Attach screenshot or receipt"
                          >
                            {isUploadingChatImage ? (
                              <span className="w-4 h-4 rounded-full border-2 border-t-[#ffd700] border-gray-600 animate-spin inline-block" />
                            ) : (
                              <Paperclip size={16} />
                            )}
                          </button>
                          <input
                            type="text"
                            placeholder={chatAttachedImage ? `Add caption for ${activeChatConv.username}...` : `Reply to ${activeChatConv.username}...`}
                            value={chatReplyText}
                            onChange={(e) => setChatReplyText(e.target.value)}
                            className="flex-1 py-2.5 px-4 text-xs bg-[#10141e] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ffd700]/80 transition"
                          />
                          <button
                            type="submit"
                            disabled={(!chatReplyText.trim() && !chatAttachedImage) || isSendingChat}
                            className="btn-gold py-2.5 px-5 text-xs font-black flex items-center gap-1.5 shadow-md disabled:opacity-50 transition cursor-pointer"
                          >
                            {isSendingChat ? (
                              <RefreshCw size={13} className="animate-spin" />
                            ) : (
                              <Send size={13} />
                            )}
                            <span>Send</span>
                          </button>
                        </form>
                      </>
                    ) : (
                      /* Concierge Command Welcome Hub (replaces the empty void) */
                      <div className="h-full flex flex-col items-center justify-center text-center p-8 relative overflow-hidden">
                        {/* Ambient background glows */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative z-10 max-w-md flex flex-col items-center">
                          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500/25 via-purple-600/30 to-amber-500/20 border border-[#ffd700]/40 flex items-center justify-center shadow-[0_0_35px_rgba(0,240,255,0.25)] mb-5">
                            <Headphones size={36} className="text-[#ffd700]" />
                          </div>

                          <h3 className="text-2xl font-black text-white tracking-wide mb-2">
                            Zorra Royals Concierge Terminal
                          </h3>
                          <p className="text-xs text-gray-400 leading-relaxed mb-6">
                            Select an active player inquiry from the left to start live messaging, review tickets, or view player 360° profiles.
                          </p>

                          {/* Quick KPI stats */}
                          <div className="grid grid-cols-3 gap-3 w-full mb-6">
                            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                              <p className="text-[10px] uppercase font-bold text-gray-400">Total Inquiries</p>
                              <p className="text-lg font-black text-[#ffd700] mt-0.5">{chatConversations.length}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                              <p className="text-[10px] uppercase font-bold text-gray-400">Unread</p>
                              <p className={`text-lg font-black mt-0.5 ${totalUnreadChat > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {totalUnreadChat}
                              </p>
                            </div>
                            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                              <p className="text-[10px] uppercase font-bold text-gray-400">Policy</p>
                              <p className="text-xs font-black text-amber-300 mt-1.5 flex items-center justify-center gap-1">
                                <ShieldCheck size={12} /> Append-Only
                              </p>
                            </div>
                          </div>

                          {chatConversations.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const target = chatConversations.find(c => (c.unreadCount || 0) > 0) || chatConversations[0];
                                setActiveChatConv(target);
                              }}
                              className="btn-gold px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(255,184,0,0.3)] hover:scale-105 transition"
                            >
                              <MessageSquare size={15} />
                              <span>Open Latest Player Inquiry</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 10: KYC VERIFICATION */}
          {activeTab === 'kyc' && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black font-serif text-white">US Identity Verification (KYC) Queue</h2>
              <div className="bg-[#10141e] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                {/* Desktop View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#07080b] text-gray-400 uppercase border-b border-white/5 font-bold">
                      <tr>
                        <th className="p-3">Player</th>
                        <th className="p-3">Legal Name</th>
                        <th className="p-3">DOB</th>
                        <th className="p-3">State</th>
                        <th className="p-3">SSN Last 4</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {kycRequests.map(k => (
                        <tr key={k.id || k._id} className="hover:bg-white/[0.02]">
                          <td className="p-3 font-bold text-white">{k.username}</td>
                          <td className="p-3 text-gray-300">{k.legalName}</td>
                          <td className="p-3 text-gray-400">{k.dob}</td>
                          <td className="p-3 text-[#ffd700] font-bold">{k.state}</td>
                          <td className="p-3 font-mono text-gray-300">{k.ssnLast4}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              k.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {k.status}
                            </span>
                          </td>
                          <td className="p-3 text-right space-x-2">
                            {k.status === 'pending' && (
                              <>
                                <button
                                  onClick={async () => {
                                    await fetch('/api/kyc', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ kycId: k.id || k._id, action: 'approve' }),
                                    });
                                    setKycRequests(kycRequests.map(item => (item.id === k.id || item._id === k._id) ? { ...item, status: 'approved' } : item));
                                  }}
                                  className="btn-gold py-1 px-3 text-[11px] font-bold"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={async () => {
                                    await fetch('/api/kyc', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ kycId: k.id || k._id, action: 'reject' }),
                                    });
                                    setKycRequests(kycRequests.map(item => (item.id === k.id || item._id === k._id) ? { ...item, status: 'rejected' } : item));
                                  }}
                                  className="px-2.5 py-1 rounded bg-red-500/20 text-red-400 font-bold text-[11px]"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="block sm:hidden divide-y divide-white/5">
                  {kycRequests.map(k => (
                    <div key={k.id || k._id} className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white text-xs block">{k.username}</span>
                          <span className="text-[11px] text-gray-400">{k.legalName}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          k.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {k.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-black/40 border border-white/5 text-center text-xs">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 block">DOB</span>
                          <span className="text-gray-300 font-mono text-[11px]">{k.dob || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 block">State</span>
                          <span className="text-[#ffd700] font-bold font-mono text-[11px]">{k.state || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-gray-400 block">SSN Last 4</span>
                          <span className="text-gray-300 font-mono text-[11px]">{k.ssnLast4 || '—'}</span>
                        </div>
                      </div>

                      {k.status === 'pending' && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={async () => {
                              await fetch('/api/kyc', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ kycId: k.id || k._id, action: 'approve' }),
                              });
                              setKycRequests(kycRequests.map(item => (item.id === k.id || item._id === k._id) ? { ...item, status: 'approved' } : item));
                            }}
                            className="flex-1 btn-gold py-1.5 px-3 text-xs font-bold text-center"
                          >
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              await fetch('/api/kyc', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ kycId: k.id || k._id, action: 'reject' }),
                              });
                              setKycRequests(kycRequests.map(item => (item.id === k.id || item._id === k._id) ? { ...item, status: 'rejected' } : item));
                            }}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-red-500/20 text-red-400 font-bold text-xs text-center border border-red-500/30"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: PROMO & MULTI-CHANNEL SUITE (Identical to Vegas One + Royal Gold Luxury) */}
          {activeTab === 'promos' && (() => {
            const filteredPromos = promos.filter(p => {
              if (promoFilter === 'active' && !p.isActive) return false;
              if (promoFilter === 'freeplay' && Number(p.minDeposit || 0) > 0) return false;
              if (promoFilter === 'deposit_boost' && Number(p.minDeposit || 0) <= 0) return false;
              if (!promoSearchQuery.trim()) return true;
              const q = promoSearchQuery.toLowerCase();
              return (
                (p.code && p.code.toLowerCase().includes(q)) ||
                (p.title && p.title.toLowerCase().includes(q)) ||
                (p.tag && p.tag.toLowerCase().includes(q))
              );
            });

            return (
              <div className="space-y-6">
                {/* Header & Sub-Tab Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#ffd700]/15 border border-[#ffd700]/40 flex items-center justify-center text-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.2)]">
                      <Gift size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black font-serif text-white tracking-wide">
                        Promotions, Push &amp; Promo Drops
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Manage player coupon codes, deposit bonus boosts, and dispatch multi-channel push broadcasts.
                      </p>
                    </div>
                  </div>

                  {/* Sub-tab Pills */}
                  <div className="p-1 rounded-xl bg-[#090b10] border border-white/10 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPromoActiveSubTab('campaigns')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                        promoActiveSubTab === 'campaigns'
                          ? 'bg-gradient-to-r from-[#ffd700] to-[#b38f26] text-black shadow-md'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Gift size={13} />
                      <span>Promo Codes ({promos.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPromoActiveSubTab('broadcast')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
                        promoActiveSubTab === 'broadcast'
                          ? 'bg-gradient-to-r from-[#ffd700] to-[#b38f26] text-black shadow-md'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Megaphone size={13} />
                      <span>Push Broadcast Hub</span>
                    </button>
                  </div>
                </div>

                {/* SUB-TAB 1: PROMO CODES */}
                {promoActiveSubTab === 'campaigns' && (
                  <div className="space-y-5">
                    {/* Filter & Action Toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Search Input */}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#10141e] border border-white/10 rounded-xl focus-within:border-[#ffd700] w-56">
                          <Search size={13} className="text-gray-400 shrink-0" />
                          <input
                            type="text"
                            placeholder="Search code or tag..."
                            value={promoSearchQuery}
                            onChange={(e) => setPromoSearchQuery(e.target.value)}
                            className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
                          />
                        </div>

                        {/* Filter Pills */}
                        {[
                          { id: 'all', label: 'All' },
                          { id: 'active', label: 'Active Only' },
                          { id: 'freeplay', label: 'Freeplay' },
                          { id: 'deposit_boost', label: 'Deposit Boost' },
                        ].map(f => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setPromoFilter(f.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              promoFilter === f.id
                                ? 'bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/40'
                                : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                            }`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowCreatePromoModal(true)}
                        className="btn-gold px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg"
                      >
                        <Plus size={14} />
                        <span>Create Promo Code</span>
                      </button>
                    </div>

                    {/* Promos Cards Grid */}
                    {filteredPromos.length === 0 ? (
                      <div className="p-12 text-center bg-[#10141e] border border-white/10 rounded-2xl">
                        <Gift size={40} className="text-[#ffd700]/40 mx-auto mb-3" />
                        <h4 className="font-serif font-black text-white text-base">No Promotions Found</h4>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto mb-4">
                          {promoSearchQuery ? 'No promos matched your search query.' : 'Launch your first promo code or deposit boost for players!'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowCreatePromoModal(true)}
                          className="btn-gold px-4 py-2 text-xs font-black"
                        >
                          Create First Promo Code
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPromos.map(p => (
                          <div
                            key={p.id}
                            className={`rounded-2xl p-5 border transition flex flex-col justify-between ${
                              p.isActive
                                ? 'bg-[#10141e] border-[#d4af37]/30 shadow-xl'
                                : 'bg-[#0a0718]/80 border-white/10 opacity-70'
                            }`}
                          >
                            <div>
                              {/* Tag & Status Toggle */}
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/30 flex items-center gap-1">
                                  <Tag size={10} />
                                  <span>{p.tag || 'PROMO'}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePromoActive(p)}
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase transition ${
                                    p.isActive
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                      : 'bg-white/10 text-gray-400 border border-white/15'
                                  }`}
                                >
                                  {p.isActive ? '● Active' : '○ Paused'}
                                </button>
                              </div>

                              {/* Coupon Code Box */}
                              <div className="p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between gap-2 mb-3">
                                <div>
                                  <p className="text-[9px] uppercase font-bold text-gray-400">Coupon Code</p>
                                  <p className="text-base font-black text-[#ffd700] tracking-wider font-mono">
                                    {p.code}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(p.code);
                                    alert(`Copied "${p.code}" to clipboard!`);
                                  }}
                                  className="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white transition"
                                  title="Copy Code"
                                >
                                  <Copy size={13} />
                                </button>
                              </div>

                              <h4 className="text-sm font-black text-white mb-1">{p.title}</h4>
                              <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed">
                                {p.description || 'Instant dollar credits credited directly to your royal balance.'}
                              </p>

                              {/* Reward Badge */}
                              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 mb-4 text-center">
                                <p className="text-[9px] uppercase font-bold text-gray-400">Reward Dollar Credit</p>
                                <p className="text-sm font-black text-emerald-400 font-mono mt-0.5">
                                  +${Number(p.rewardUSD || p.rewardSC || 0).toFixed(2)} USD
                                </p>
                              </div>
                            </div>

                            {/* Footer: Min Deposit, Claims & Delete */}
                            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
                              <div>
                                <span className="font-semibold text-gray-300">
                                  {p.minDeposit > 0 ? `$${p.minDeposit} Min Deposit` : 'Freeplay Drop'}
                                </span>
                                <span className="mx-1.5">•</span>
                                <span>{p.timesUsed || 0} Claimed</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditPromoModal({
                                    open: true,
                                    data: {
                                      id: p.id || p._id,
                                      code: p.code || '',
                                      title: p.title || '',
                                      description: p.description || '',
                                      rewardUSD: p.rewardUSD || p.rewardSC || 10,
                                      rewardSC: p.rewardUSD || p.rewardSC || 10,
                                      minDeposit: p.minDeposit || 0,
                                      tag: p.tag || 'EXCLUSIVE',
                                      expiresAt: p.expiresAt || '',
                                      isActive: p.isActive !== false,
                                    },
                                    saving: false,
                                  })}
                                  className="p-1.5 rounded-lg text-[#ffd700] hover:text-white hover:bg-[#ffd700]/20 bg-[#ffd700]/10 border border-[#ffd700]/30 transition"
                                  title="Edit Promo"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePromo(p)}
                                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition"
                                  title="Delete Promo"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Create Promo Modal */}
                    {showCreatePromoModal && (
                      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-[#10141e] border border-[#d4af37]/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
                          <div className="flex items-center justify-between pb-3 border-b border-white/10">
                            <div>
                              <h3 className="font-serif font-black text-lg text-white">Create New Promo Code</h3>
                              <p className="text-xs text-gray-400 mt-0.5">Issue custom coupon drops or deposit boosts</p>
                            </div>
                            <button
                              onClick={() => setShowCreatePromoModal(false)}
                              className="text-gray-400 hover:text-white"
                            >
                              <X size={18} />
                            </button>
                          </div>

                          <form onSubmit={handleCreatePromoCode} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-bold text-gray-300 block mb-1">Coupon Code</label>
                                <input
                                  type="text"
                                  placeholder="e.g. ROYAL100"
                                  value={newPromoData.code}
                                  onChange={(e) => setNewPromoData({ ...newPromoData, code: e.target.value.toUpperCase() })}
                                  required
                                  className="w-full bg-[#07080b] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-white font-mono font-bold text-xs outline-none focus:border-[#ffd700]"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-300 block mb-1">Tag / Category</label>
                                <select
                                  value={newPromoData.tag}
                                  onChange={(e) => setNewPromoData({ ...newPromoData, tag: e.target.value })}
                                  className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                                >
                                  <option value="EXCLUSIVE">💎 EXCLUSIVE</option>
                                  <option value="HOT DROP">🔥 HOT DROP</option>
                                  <option value="FREEPLAY">🎁 FREEPLAY</option>
                                  <option value="VIP BOOST">⚡ VIP BOOST</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="text-xs font-bold text-gray-300 block mb-1">Promo Title</label>
                              <input
                                type="text"
                                placeholder="e.g. $10 Freeplay Royal Drop"
                                value={newPromoData.title}
                                onChange={(e) => setNewPromoData({ ...newPromoData, title: e.target.value })}
                                required
                                className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-bold text-gray-300 block mb-1">Description</label>
                              <textarea
                                rows={2}
                                placeholder="Details about this drop..."
                                value={newPromoData.description}
                                onChange={(e) => setNewPromoData({ ...newPromoData, description: e.target.value })}
                                className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-bold text-gray-300 block mb-1">Dollar Reward ($ USD)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.5"
                                  value={newPromoData.rewardUSD}
                                  onChange={(e) => setNewPromoData({ ...newPromoData, rewardUSD: e.target.value })}
                                  required
                                  className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold text-xs outline-none focus:border-[#ffd700]"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-gray-300 block mb-1">Minimum Deposit Required ($)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0 = No deposit needed"
                                  value={newPromoData.minDeposit}
                                  onChange={(e) => setNewPromoData({ ...newPromoData, minDeposit: e.target.value })}
                                  className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white font-mono text-xs outline-none focus:border-[#ffd700]"
                                />
                              </div>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
                              <button
                                type="button"
                                onClick={() => setShowCreatePromoModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={isSavingPromo}
                                className="btn-gold py-2 px-5 text-xs font-black uppercase"
                              >
                                {isSavingPromo ? 'Creating...' : 'Create & Publish'}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SUB-TAB 2: MULTI-CHANNEL BROADCAST HUB */}
                {promoActiveSubTab === 'broadcast' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left Column: Broadcast Composer (7 cols) */}
                      <div className="lg:col-span-7 bg-[#10141e] border border-[#d4af37]/30 p-6 rounded-2xl space-y-4 shadow-xl">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                          <div>
                            <h3 className="font-serif font-black text-white text-base flex items-center gap-2">
                              <Megaphone size={16} className="text-[#ffd700]" />
                              <span>Dispatch Multi-Channel Broadcast</span>
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Push alerts to mobile notifications, in-app inbox, and Chrome web push
                            </p>
                          </div>
                          {pushStatus && (
                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                              {pushStatus}
                            </span>
                          )}
                        </div>

                        <form onSubmit={handleDispatchBroadcast} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs font-bold text-gray-300 block mb-1">Target Channel</label>
                              <select
                                value={pushChannel}
                                onChange={(e) => setPushChannel(e.target.value)}
                                className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                              >
                                <option value="all">📢 All Channels (Web + App + In-App)</option>
                                <option value="web">🌐 Web &amp; Mobile Push Only</option>
                                <option value="inapp">📬 In-App Inbox Only</option>
                                <option value="sms">📱 VIP Direct Alert</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-bold text-gray-300 block mb-1">Target Audience</label>
                              <select
                                value={pushSegment}
                                onChange={(e) => setPushSegment(e.target.value)}
                                className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                              >
                                <option value="all">👥 All Registered Patrons</option>
                                <option value="vip">👑 Active VIPs Only</option>
                                <option value="depositors">💳 Recent Depositors</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-gray-300 block mb-1">Broadcast Headline</label>
                            <input
                              type="text"
                              placeholder="e.g. 👑 Royal VIP Drop: Double Your Deposit Tonight!"
                              value={pushTitle}
                              onChange={(e) => setPushTitle(e.target.value)}
                              required
                              className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-gray-300 block mb-1">Message Body</label>
                            <textarea
                              rows={3}
                              placeholder="Enter broadcast message details..."
                              value={pushBody}
                              onChange={(e) => setPushBody(e.target.value)}
                              required
                              className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700] leading-relaxed"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-bold text-gray-300 block mb-1">Action URL (CTA Redirect)</label>
                            <input
                              type="text"
                              placeholder="/deposit or /games or https://..."
                              value={pushActionUrl}
                              onChange={(e) => setPushActionUrl(e.target.value)}
                              className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                            />
                          </div>

                          <div className="pt-2 flex items-center justify-end gap-3">
                            <button
                              type="submit"
                              disabled={isDispatchingPush}
                              className="btn-gold py-2.5 px-6 text-xs font-black uppercase flex items-center gap-2 shadow-lg"
                            >
                              <Send size={14} />
                              <span>{isDispatchingPush ? 'Dispatching...' : 'Dispatch Royal Broadcast'}</span>
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Right Column: Live Mobile Push Mockup (5 cols) */}
                      <div className="lg:col-span-5 bg-[#10141e] border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center shadow-xl">
                        <div className="flex items-center gap-2 mb-4 self-start">
                          <Smartphone size={16} className="text-[#ffd700]" />
                          <h4 className="font-serif font-black text-white text-xs tracking-wider uppercase">
                            Live Smartphone Mockup Preview
                          </h4>
                        </div>

                        {/* Phone Shell */}
                        <div className="w-[280px] rounded-[36px] bg-[#07080b] border-[6px] border-[#222] p-3 shadow-2xl relative">
                          {/* Notch */}
                          <div className="w-20 h-4 bg-[#222] rounded-full mx-auto mb-4" />

                          {/* Time */}
                          <div className="text-center text-[10px] text-gray-400 font-mono mb-6">9:41 AM</div>

                          {/* Push Notification Card */}
                          <div className="bg-[#181c2e]/95 border border-[#ffd700]/30 rounded-2xl p-3 shadow-xl space-y-1.5 backdrop-blur animate-in fade-in">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <img src="/logo.png" alt="Icon" className="w-4 h-4 rounded-full" />
                                <span className="text-[10px] font-black text-[#ffd700]">ZORRA ROYALS</span>
                              </div>
                              <span className="text-[9px] text-gray-400">now</span>
                            </div>
                            <p className="text-xs font-black text-white leading-tight">
                              {pushTitle || '👑 Royal VIP Flash Drop!'}
                            </p>
                            <p className="text-[10px] text-gray-300 line-clamp-3 leading-snug">
                              {pushBody || 'Tap to claim your exclusive 100% deposit boost. Active for the next 2 hours only!'}
                            </p>
                          </div>

                          <div className="mt-28 text-center text-[9px] text-gray-500">
                            Push Preview (Android / Web)
                          </div>
                          <div className="w-24 h-1 bg-white/30 rounded-full mx-auto mt-4 mb-1" />
                        </div>
                      </div>
                    </div>

                    {/* Past Broadcasts Log */}
                    <div className="bg-[#10141e] border border-white/10 rounded-2xl overflow-hidden shadow-xl space-y-2">
                      <div className="p-4 bg-[#07080b] border-b border-white/5 flex items-center justify-between">
                        <span className="text-xs font-black text-white uppercase tracking-wider">
                          Broadcast History Logs ({broadcastLogs.length})
                        </span>
                        <span className="text-[11px] text-gray-400 font-mono">
                          Firebase FCM &amp; In-App Dispatches
                        </span>
                      </div>

                      {/* Desktop Table View */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#07080b] text-gray-400 uppercase border-b border-white/5 font-bold">
                            <tr>
                              <th className="p-3">Dispatched Time</th>
                              <th className="p-3">Headline &amp; Content</th>
                              <th className="p-3">Channel</th>
                              <th className="p-3">Audience</th>
                              <th className="p-3">Sender</th>
                              <th className="p-3 text-right">Delivery</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {broadcastLogs.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-6 text-center text-gray-500">
                                  No broadcasts recorded yet. Compose and dispatch one above!
                                </td>
                              </tr>
                            ) : (
                              broadcastLogs.map(b => (
                                <tr key={b.id} className="hover:bg-white/[0.02]">
                                  <td className="p-3 font-mono text-gray-400 whitespace-nowrap">
                                    {new Date(b.createdAt).toLocaleString()}
                                  </td>
                                  <td className="p-3 max-w-sm">
                                    <div className="font-bold text-white">{b.title}</div>
                                    <div className="text-[11px] text-gray-400 truncate">{b.message}</div>
                                  </td>
                                  <td className="p-3 uppercase font-mono text-[#ffd700] text-[10px]">
                                    {b.channel || 'ALL'}
                                  </td>
                                  <td className="p-3 capitalize text-gray-300">
                                    {b.segment || 'All Patrons'}
                                  </td>
                                  <td className="p-3 text-gray-400 font-bold">
                                    {b.sentBy || 'Admin'}
                                  </td>
                                  <td className="p-3 text-right">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                      Delivered
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards View */}
                      <div className="block sm:hidden divide-y divide-white/5">
                        {broadcastLogs.length === 0 ? (
                          <div className="p-6 text-center text-gray-500 text-xs">
                            No broadcasts recorded yet.
                          </div>
                        ) : (
                          broadcastLogs.map(b => (
                            <div key={b.id} className="p-4 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] uppercase font-mono font-bold text-[#ffd700]">
                                  {b.channel || 'ALL CHANNELS'}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                  Delivered
                                </span>
                              </div>

                              <div>
                                <h4 className="font-bold text-white text-xs">{b.title}</h4>
                                <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{b.message}</p>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1 font-mono">
                                <span>{new Date(b.createdAt).toLocaleString()}</span>
                                <span className="capitalize text-gray-400">Audience: {b.segment || 'All'}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 12: STAFF MANAGEMENT */}
          {activeTab === 'staff' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black font-serif text-white">Staff Management &amp; RBAC Control</h2>

              {/* Add New Staff Form */}
              <div className="bg-[#10141e] border border-[#d4af37]/25 p-5 rounded-2xl shadow-xl space-y-4 max-w-2xl">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <UserCheck size={15} className="text-[#ffd700]" />
                  <span>Provision New Staff Officer</span>
                </h3>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const res = await fetch('/api/admin/staff', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newStaff),
                    });
                    const d = await res.json();
                    if (d.success) {
                      setNewStaff({ username: '', email: '', password: '', role: 'financial_manager' });
                      fetch('/api/admin/staff').then(r => r.json()).then(s => { if (s.success) setStaffList(s.staff || []); });
                    } else {
                      alert(d.error || 'Failed to create staff');
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Staff Username"
                      value={newStaff.username}
                      onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                      required
                      className="bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                    />
                    <input
                      type="email"
                      placeholder="Staff Work Email"
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                      required
                      className="bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={newStaff.password}
                      onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      required
                      className="bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                    />
                    <select
                      value={newStaff.role}
                      onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                      className="bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-[#ffd700]"
                    >
                      <option value="operation_admin">Operations Manager</option>
                      <option value="financial_manager">Financial Manager</option>
                      <option value="coin_manager">Coin Allotment Officer</option>
                      <option value="chat_support">Live Chat Support Agent</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <button type="submit" className="btn-gold py-2 px-5 text-xs font-black uppercase">
                    Provision Account
                  </button>
                </form>
              </div>

              {/* Staff List */}
              <div className="bg-[#10141e] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
                {/* Desktop View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#07080b] text-gray-400 uppercase border-b border-white/5 font-bold">
                      <tr>
                        <th className="p-3">Staff Username</th>
                        <th className="p-3">Work Email</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {staffList.map(s => (
                        <tr key={s.id || s._id} className="hover:bg-white/[0.02]">
                          <td className="p-3 font-bold text-white">{s.username}</td>
                          <td className="p-3 text-gray-300">{s.email}</td>
                          <td className="p-3 font-bold text-[#ffd700] uppercase">{s?.role ? s.role.replace('_', ' ') : 'STAFF'}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              s.isBanned ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {s.isBanned ? 'Suspended' : 'Active'}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditStaffModal({
                                  open: true,
                                  data: {
                                    id: s.id || s._id,
                                    username: s.username || '',
                                    email: s.email || '',
                                    role: s.role || 'financial_manager',
                                    isBanned: Boolean(s.isBanned),
                                    newPassword: '',
                                  },
                                  saving: false,
                                })}
                                className="px-2.5 py-1 rounded bg-[#ffd700]/15 hover:bg-[#ffd700]/25 text-[#ffd700] text-[11px] font-bold border border-[#ffd700]/30 transition flex items-center gap-1"
                              >
                                <Edit2 size={11} /> Edit
                              </button>
                              <button
                                onClick={async () => {
                                  await fetch('/api/admin/staff', {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ staffId: s.id || s._id, isBanned: !s.isBanned }),
                                  });
                                  setStaffList(staffList.map(item => (item.id === s.id || item._id === s._id) ? { ...item, isBanned: !s.isBanned } : item));
                                }}
                                className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white transition"
                              >
                                {s.isBanned ? 'Reactivate' : 'Suspend'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View */}
                <div className="block sm:hidden divide-y divide-white/5">
                  {staffList.map(s => (
                    <div key={s.id || s._id} className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white text-xs block">{s.username}</span>
                          <span className="text-[11px] text-gray-400">{s.email}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.isBanned ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {s.isBanned ? 'Suspended' : 'Active'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-bold text-[#ffd700] uppercase font-mono bg-[#ffd700]/10 border border-[#ffd700]/30 px-2 py-0.5 rounded">
                          {s.role?.replace('_', ' ')}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditStaffModal({
                              open: true,
                              data: {
                                id: s.id || s._id,
                                username: s.username || '',
                                email: s.email || '',
                                role: s.role || 'financial_manager',
                                isBanned: Boolean(s.isBanned),
                                newPassword: '',
                              },
                              saving: false,
                            })}
                            className="px-2.5 py-1.5 rounded-xl bg-[#ffd700]/15 hover:bg-[#ffd700]/25 text-xs font-bold text-[#ffd700] border border-[#ffd700]/30 transition flex items-center gap-1"
                          >
                            <Edit2 size={12} /> Edit
                          </button>
                          <button
                            onClick={async () => {
                              await fetch('/api/admin/staff', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ staffId: s.id || s._id, isBanned: !s.isBanned }),
                              });
                              setStaffList(staffList.map(item => (item.id === s.id || item._id === s._id) ? { ...item, isBanned: !s.isBanned } : item));
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition"
                          >
                            {s.isBanned ? 'Reactivate' : 'Suspend'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 13: SYSTEM SETTINGS (PLAYER PARADISE STANDARD) */}
          {activeTab === 'settings' && user.role === 'super_admin' && (
            <div className="space-y-6 max-w-6xl">
              {/* Header Card */}
              <div className="relative overflow-hidden bg-gradient-to-r from-[#10141e] via-[#151a28] to-[#10141e] border border-[#d4af37]/35 rounded-2xl p-6 sm:p-7 shadow-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#ffd700]/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                    <Settings size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black font-serif text-white tracking-wide">
                      System &amp; Geo Access Policy
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-2xl">
                      Federal compliance, geo-blocking, cashout thresholds &amp; automated player / referral bonus parameters in real-time.
                    </p>
                  </div>
                </div>

                {bonusSaveMessage && (
                  <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-4 py-2.5 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-in fade-in relative z-10">
                    <CheckCircle2 size={16} />
                    <span>{bonusSaveMessage}</span>
                  </div>
                )}
              </div>

              {/* Top 3 Compliance & Operational Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Platform Geo Access Policy */}
                <div className="p-5 rounded-2xl bg-[#10141e] border border-[#d4af37]/30 shadow-xl flex flex-col justify-between gap-4 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#ffd700] uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#ffd700] shadow-[0_0_8px_#ffd700]" />
                      Platform Geo Access
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] flex items-center justify-center shrink-0">
                      <ShieldCheck size={18} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <select
                      value={sysSettings?.geoRestrictionEnabled ? 'enabled' : 'disabled'}
                      onChange={async (e) => {
                        const enabled = e.target.value === 'enabled';
                        await fetch('/api/admin/settings', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ geoRestrictionEnabled: enabled }),
                        });
                        setSysSettings(prev => ({ ...prev, geoRestrictionEnabled: enabled }));
                        setBonusSaveMessage('Geo access policy updated!');
                        setTimeout(() => setBonusSaveMessage(null), 3000);
                      }}
                      className="w-full rounded-xl px-3.5 py-2.5 text-xs text-white bg-[#07080b] border border-[#d4af37]/30 outline-none cursor-pointer font-bold"
                    >
                      <option value="disabled">All 50 US States Permitted (Open Access)</option>
                      <option value="enabled">USA Standard Traffic (Restricted States)</option>
                    </select>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      {sysSettings?.geoRestrictionEnabled
                        ? 'Restricted states enforced according to state sweepstakes regulations.'
                        : 'No state restrictions. Players from all regions have full access to play and redeem.'}
                    </p>
                  </div>
                </div>

                {/* 2. Minimum Cashout Threshold */}
                <div className="p-5 rounded-2xl bg-[#10141e] border border-emerald-500/30 shadow-xl flex flex-col justify-between gap-4 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10B981]" />
                      Minimum Cashout Threshold
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                      <DollarSign size={18} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type="number"
                        min="5"
                        max="1000"
                        value={sysSettings?.minCashoutThreshold ?? sysSettings?.minWithdrawal ?? 50}
                        onChange={(e) => setSysSettings(prev => ({
                          ...prev,
                          minCashoutThreshold: e.target.value,
                          minWithdrawal: e.target.value,
                        }))}
                        className="w-full rounded-xl px-3.5 py-2 text-white font-mono font-black text-base bg-[#07080b] border border-emerald-500/30 outline-none pr-12"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-bold text-emerald-400">USD</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Standard threshold verified against 1x coin rollover playthrough requirements before withdrawal.
                    </p>
                  </div>
                </div>

                {/* 3. Referral Commission Engine Status */}
                <div className="p-5 rounded-2xl bg-[#10141e] border border-[#d4af37]/30 shadow-xl flex flex-col justify-between gap-4 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#ffd700] uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#ffd700] shadow-[0_0_8px_#ffd700]" />
                      Referral Engine
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] flex items-center justify-center shrink-0">
                      <Users size={18} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300">Status</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                        Active &amp; Automated
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed pt-1">
                      Referrers receive automatic direct-to-wallet credits the moment an invited friend's first deposit is approved.
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Player & Referral Bonus Engine Container */}
              <div className="bg-[#10141e] border border-[#d4af37]/35 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                      <Gift size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black font-serif text-white flex items-center gap-2">
                        Dynamic Player &amp; Referral Bonus Engine
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
                        Configure first-deposit welcome boost, reload match, and friend referral commission rates in real-time.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveBonusSettings}
                    disabled={savingBonusSettings}
                    className="btn-gold py-2.5 px-6 text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 cursor-pointer shadow-lg hover:scale-102 transition"
                  >
                    <Save size={15} />
                    <span>{savingBonusSettings ? 'Saving...' : 'Save Bonus Configuration'}</span>
                  </button>
                </div>

                <form onSubmit={handleSaveBonusSettings} className="space-y-6">
                  {/* 3 Balanced Bonus Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 1. Welcome Bonus Card */}
                    <div className="bg-[#07080b] border border-[#d4af37]/30 rounded-2xl p-5 flex flex-col justify-between gap-5 shadow-xl relative overflow-hidden">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#ffd700] uppercase tracking-wider font-serif">
                            1. Welcome Pack (First Deposit)
                          </span>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#ffd700]/15 border border-[#ffd700]/40 text-[#ffd700] font-black uppercase tracking-wider">
                            New Players Only
                          </span>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-300 block mb-1 uppercase tracking-wider">
                            Bonus Match %
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="1000"
                              value={sysSettings?.welcomeBonusPercent ?? 100}
                              onChange={(e) => setSysSettings(prev => ({ ...prev, welcomeBonusPercent: e.target.value }))}
                              className="w-full rounded-xl px-3.5 py-2 text-white font-mono font-black text-sm pr-8 bg-[#10141e] border border-[#d4af37]/25 outline-none focus:border-[#ffd700]"
                              required
                            />
                            <span className="absolute right-3.5 top-2 text-xs font-bold text-[#ffd700]">%</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-300 block mb-1 uppercase tracking-wider">
                            Banner Title
                          </label>
                          <input
                            type="text"
                            value={sysSettings?.welcomeBonusTitle || 'FIRST DEPOSIT BONUS'}
                            onChange={(e) => setSysSettings(prev => ({ ...prev, welcomeBonusTitle: e.target.value }))}
                            className="w-full rounded-xl px-3.5 py-2 text-white font-bold text-xs bg-[#10141e] border border-[#d4af37]/25 outline-none focus:border-[#ffd700]"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-300 block mb-1 uppercase tracking-wider">
                            Banner Subtitle / Description
                          </label>
                          <textarea
                            rows={3}
                            value={sysSettings?.welcomeBonusSubtitle || 'Claim a royal match on your first deposit! Fast credits & prompt payouts.'}
                            onChange={(e) => setSysSettings(prev => ({ ...prev, welcomeBonusSubtitle: e.target.value }))}
                            className="w-full rounded-xl px-3.5 py-2 text-white text-xs leading-relaxed bg-[#10141e] border border-[#d4af37]/25 outline-none focus:border-[#ffd700]"
                            required
                          />
                        </div>
                      </div>

                      {/* Live Simulation Card */}
                      <div className="pt-4 border-t border-white/10 space-y-1.5">
                        <div className="rounded-xl p-3 text-[11px] bg-[#10141e] border border-[#d4af37]/25 text-[#ffd700] space-y-1">
                          <span className="font-bold block text-white">Live Simulation:</span>
                          <span>
                            Deposit $50 → Base $50 + ${(50 * (Number(sysSettings?.welcomeBonusPercent || 100) / 100)).toFixed(0)} Bonus ={' '}
                            <strong>${(50 + 50 * (Number(sysSettings?.welcomeBonusPercent || 100) / 100)).toFixed(0)} Total</strong>
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400">
                          Automatically applied to player's 1st deposit on the site.
                        </p>
                      </div>
                    </div>

                    {/* 2. Regular Reload Bonus Card */}
                    <div className="bg-[#07080b] border border-purple-500/30 rounded-2xl p-5 flex flex-col justify-between gap-5 shadow-xl relative overflow-hidden">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-purple-300 uppercase tracking-wider font-serif">
                            2. Regular Reload Bonus
                          </span>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 font-black uppercase tracking-wider">
                            Every Reload
                          </span>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-300 block mb-1 uppercase tracking-wider">
                            Bonus Match %
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="500"
                              value={sysSettings?.regularBonusPercent ?? 20}
                              onChange={(e) => setSysSettings(prev => ({ ...prev, regularBonusPercent: e.target.value }))}
                              className="w-full rounded-xl px-3.5 py-2 text-white font-mono font-black text-sm pr-8 bg-[#10141e] border border-purple-500/25 outline-none focus:border-purple-400"
                              required
                            />
                            <span className="absolute right-3.5 top-2 text-xs font-bold text-purple-400">%</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-300 block mb-1 uppercase tracking-wider">
                            Banner Title
                          </label>
                          <input
                            type="text"
                            value={sysSettings?.regularBonusTitle || 'REGULAR RELOAD BONUS'}
                            onChange={(e) => setSysSettings(prev => ({ ...prev, regularBonusTitle: e.target.value }))}
                            className="w-full rounded-xl px-3.5 py-2 text-white font-bold text-xs bg-[#10141e] border border-purple-500/25 outline-none focus:border-purple-400"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-300 block mb-1 uppercase tracking-wider">
                            Banner Subtitle / Description
                          </label>
                          <textarea
                            rows={3}
                            value={sysSettings?.regularBonusSubtitle || 'Enjoy bonus on every reload! Boost your palace treasury anytime.'}
                            onChange={(e) => setSysSettings(prev => ({ ...prev, regularBonusSubtitle: e.target.value }))}
                            className="w-full rounded-xl px-3.5 py-2 text-white text-xs leading-relaxed bg-[#10141e] border border-purple-500/25 outline-none focus:border-purple-400"
                            required
                          />
                        </div>
                      </div>

                      {/* Live Simulation Card */}
                      <div className="pt-4 border-t border-white/10 space-y-1.5">
                        <div className="rounded-xl p-3 text-[11px] bg-[#10141e] border border-purple-500/25 text-purple-300 space-y-1">
                          <span className="font-bold block text-white">Live Simulation:</span>
                          <span>
                            Deposit $50 → Base $50 + ${(50 * (Number(sysSettings?.regularBonusPercent || 20) / 100)).toFixed(0)} Bonus ={' '}
                            <strong>${(50 + 50 * (Number(sysSettings?.regularBonusPercent || 20) / 100)).toFixed(0)} Total</strong>
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400">
                          Automatically applied to 2nd deposit onward.
                        </p>
                      </div>
                    </div>

                    {/* 3. Referral & Friend Bonus Card */}
                    <div className="bg-[#07080b] border border-emerald-500/35 rounded-2xl p-5 flex flex-col justify-between gap-5 shadow-xl relative overflow-hidden">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-400 uppercase tracking-wider font-serif">
                            3. Referral &amp; Friend Bonus
                          </span>
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-black uppercase tracking-wider">
                            Inviter Reward
                          </span>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-300 block mb-1 uppercase tracking-wider">
                            Referral Reward %
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={sysSettings?.referralBonusPercent ?? 50}
                              onChange={(e) => setSysSettings(prev => ({ ...prev, referralBonusPercent: e.target.value }))}
                              className="w-full rounded-xl px-3.5 py-2 text-emerald-300 font-mono font-black text-sm pr-8 bg-[#10141e] border border-emerald-500/30 outline-none focus:border-emerald-400"
                              required
                            />
                            <span className="absolute right-3.5 top-2 text-xs font-bold text-emerald-400">%</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-300 block mb-1 uppercase tracking-wider">
                            Banner / Badge Title
                          </label>
                          <input
                            type="text"
                            value={sysSettings?.referralBonusTitle || 'FRIEND REFERRAL BONUS'}
                            onChange={(e) => setSysSettings(prev => ({ ...prev, referralBonusTitle: e.target.value }))}
                            className="w-full rounded-xl px-3.5 py-2 text-white font-bold text-xs bg-[#10141e] border border-emerald-500/30 outline-none focus:border-emerald-400"
                            required
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-gray-300 block mb-1 uppercase tracking-wider">
                            Reward Description / Policy
                          </label>
                          <textarea
                            rows={3}
                            value={sysSettings?.referralBonusSubtitle || 'Earn instant bonus directly into your wallet when your friends join and complete their first deposit!'}
                            onChange={(e) => setSysSettings(prev => ({ ...prev, referralBonusSubtitle: e.target.value }))}
                            className="w-full rounded-xl px-3.5 py-2 text-white text-xs leading-relaxed bg-[#10141e] border border-emerald-500/30 outline-none focus:border-emerald-400"
                            required
                          />
                        </div>
                      </div>

                      {/* Live Simulation Card */}
                      <div className="pt-4 border-t border-white/10 space-y-2">
                        <div className="rounded-xl p-3 text-[11px] bg-[#10141e] border border-emerald-500/30 text-emerald-300 space-y-1">
                          <span className="font-bold block text-white">Live Simulation:</span>
                          <span>
                            Friend deposits $50 → Referrer receives{' '}
                            <strong>+${(50 * (Number(sysSettings?.referralBonusPercent || 50) / 100)).toFixed(2)} USD</strong> directly in their wallet!
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 text-[10px] text-gray-400 font-semibold px-1">
                          <span className="text-emerald-400">✓ Direct Wallet Credit (balance &amp; balanceSC)</span>
                          <span className="text-emerald-400">✓ Instant In-App Player Notification</span>
                          <span className="text-emerald-400">✓ Automated Ledger Audit Entry</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={savingBonusSettings}
                      className="btn-gold py-2.5 px-8 text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-lg hover:scale-102 transition"
                    >
                      <Save size={15} />
                      <span>{savingBonusSettings ? 'Saving...' : '💾 Save All Bonus Settings'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 1. EDIT GAME MODAL */}
          {editGameModal.open && editGameModal.data && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#10141e] border border-[#ffd700]/40 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/30">
                      <Gamepad2 size={18} />
                    </div>
                    <div>
                      <h3 className="font-serif font-black text-base sm:text-lg text-white">Edit Game</h3>
                      <p className="text-[11px] text-gray-400 font-mono truncate max-w-[240px] sm:max-w-xs">{editGameModal.data.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditGameModal({ open: false, data: null, saving: false })}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveEditGame} className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Game Title *</label>
                    <input
                      type="text"
                      value={editGameModal.data.title || ''}
                      onChange={(e) => setEditGameModal(prev => ({ ...prev, data: { ...prev.data, title: e.target.value } }))}
                      required
                      className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Studio / Provider</label>
                      <input
                        type="text"
                        value={editGameModal.data.provider || ''}
                        onChange={(e) => setEditGameModal(prev => ({ ...prev, data: { ...prev.data, provider: e.target.value } }))}
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Category</label>
                      <select
                        value={editGameModal.data.category || 'slots'}
                        onChange={(e) => setEditGameModal(prev => ({ ...prev, data: { ...prev.data, category: e.target.value } }))}
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                      >
                        <option value="slots">Slots</option>
                        <option value="table">Table Games</option>
                        <option value="fish">Fish Hunters</option>
                        <option value="keno">Keno / Bingo</option>
                        <option value="live">Live Dealer</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Badge Tag</label>
                      <select
                        value={editGameModal.data.badge || ''}
                        onChange={(e) => setEditGameModal(prev => ({ ...prev, data: { ...prev.data, badge: e.target.value } }))}
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                      >
                        <option value="">None (Standard)</option>
                        <option value="HOT">HOT 🔥</option>
                        <option value="EXCLUSIVE">EXCLUSIVE ⭐</option>
                        <option value="POPULAR">POPULAR 👑</option>
                        <option value="NEW">NEW ✨</option>
                        <option value="JACKPOT">JACKPOT 💰</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Catalog Status</label>
                      <button
                        type="button"
                        onClick={() => setEditGameModal(prev => ({ ...prev, data: { ...prev.data, isActive: !prev.data.isActive } }))}
                        className={`w-full py-2 px-3 rounded-xl font-bold border transition text-center ${
                          editGameModal.data.isActive !== false
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-red-500/20 text-red-400 border-red-500/40'
                        }`}
                      >
                        {editGameModal.data.isActive !== false ? 'Active (Visible)' : 'Hidden (Offline)'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Launch Play URL</label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={editGameModal.data.url || ''}
                      onChange={(e) => setEditGameModal(prev => ({ ...prev, data: { ...prev.data, url: e.target.value } }))}
                      className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Game Cover Thumbnail</label>
                    <div className="flex gap-3 items-center">
                      <div className="w-16 h-14 rounded-xl border border-white/10 overflow-hidden bg-black/50 shrink-0">
                        <img
                          src={editGameModal.data.thumbnail || '/images/vegas-777.webp'}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          placeholder="Image URL or upload below"
                          value={editGameModal.data.thumbnail || ''}
                          onChange={(e) => setEditGameModal(prev => ({ ...prev, data: { ...prev.data, thumbnail: e.target.value } }))}
                          className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-1.5 text-white outline-none focus:border-[#ffd700] text-xs font-mono"
                        />
                        <label className="inline-flex items-center gap-1.5 text-[11px] text-[#ffd700] hover:text-white cursor-pointer font-bold">
                          <Upload size={12} /> Upload New Cover Image
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                compressImage(file, (dataUrl) => {
                                  setEditGameModal(prev => ({ ...prev, data: { ...prev.data, thumbnail: dataUrl } }));
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditGameModal({ open: false, data: null, saving: false })}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editGameModal.saving}
                      className="btn-gold px-5 py-2 font-black uppercase tracking-wider text-xs flex items-center gap-1.5"
                    >
                      {editGameModal.saving ? 'Saving...' : 'Save Game Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 2. EDIT GATEWAY MODAL */}
          {editGatewayModal.open && editGatewayModal.data && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#10141e] border border-[#ffd700]/40 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/30">
                      <CreditCard size={18} />
                    </div>
                    <div>
                      <h3 className="font-serif font-black text-base sm:text-lg text-white">Edit Payment Method</h3>
                      <p className="text-[11px] text-gray-400 font-mono truncate max-w-[240px] sm:max-w-xs">{editGatewayModal.data.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditGatewayModal({ open: false, data: null, saving: false })}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveEditGateway} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Gateway Name *</label>
                      <input
                        type="text"
                        value={editGatewayModal.data.name || ''}
                        onChange={(e) => setEditGatewayModal(prev => ({ ...prev, data: { ...prev.data, name: e.target.value } }))}
                        required
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Rail Type</label>
                      <select
                        value={editGatewayModal.data.type || 'cashapp'}
                        onChange={(e) => setEditGatewayModal(prev => ({ ...prev, data: { ...prev.data, type: e.target.value } }))}
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                      >
                        <option value="cashapp">Cash App</option>
                        <option value="venmo">Venmo</option>
                        <option value="chime">Chime</option>
                        <option value="zelle">Zelle</option>
                        <option value="crypto">Cryptocurrency (BTC/USDT)</option>
                        <option value="applepay">Apple Pay</option>
                        <option value="custom">Custom Rail</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Account / Cashtag *</label>
                      <input
                        type="text"
                        value={editGatewayModal.data.accountDetails || ''}
                        onChange={(e) => setEditGatewayModal(prev => ({ ...prev, data: { ...prev.data, accountDetails: e.target.value } }))}
                        required
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700] font-mono text-[#ffd700]"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Tag</label>
                      <input
                        type="text"
                        value={editGatewayModal.data.tag || 'Instant'}
                        onChange={(e) => setEditGatewayModal(prev => ({ ...prev, data: { ...prev.data, tag: e.target.value } }))}
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Min Deposit ($ USD)</label>
                      <input
                        type="number"
                        min="1"
                        value={editGatewayModal.data.minDeposit ?? 10}
                        onChange={(e) => setEditGatewayModal(prev => ({ ...prev, data: { ...prev.data, minDeposit: e.target.value } }))}
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Max Deposit ($ USD)</label>
                      <input
                        type="number"
                        min="1"
                        value={editGatewayModal.data.maxDeposit ?? 5000}
                        onChange={(e) => setEditGatewayModal(prev => ({ ...prev, data: { ...prev.data, maxDeposit: e.target.value } }))}
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Direct Pay Link URL (Optional)</label>
                    <input
                      type="text"
                      placeholder="https://cash.app/$..."
                      value={editGatewayModal.data.paymentUrl || ''}
                      onChange={(e) => setEditGatewayModal(prev => ({ ...prev, data: { ...prev.data, paymentUrl: e.target.value } }))}
                      className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Payment Instructions</label>
                    <textarea
                      rows={2}
                      value={editGatewayModal.data.instructions || ''}
                      onChange={(e) => setEditGatewayModal(prev => ({ ...prev, data: { ...prev.data, instructions: e.target.value } }))}
                      className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700] resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-bold block mb-1">QR Code Image</label>
                    <div className="flex gap-3 items-center">
                      {editGatewayModal.data.qrCode ? (
                        <div className="w-16 h-16 rounded-xl border border-white/10 overflow-hidden bg-white p-1 shrink-0">
                          <img
                            src={editGatewayModal.data.qrCode}
                            alt="QR"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-gray-500 shrink-0">
                          <QrCode size={20} />
                        </div>
                      )}
                      <div className="flex-1 space-y-1.5">
                        <label className="inline-flex items-center gap-1.5 text-[11px] text-[#ffd700] hover:text-white cursor-pointer font-bold">
                          <Upload size={12} /> {editGatewayModal.data.qrCode ? 'Replace QR Code' : 'Upload QR Code'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                compressImage(file, (dataUrl) => {
                                  setEditGatewayModal(prev => ({ ...prev, data: { ...prev.data, qrCode: dataUrl } }));
                                }, 600);
                              }
                            }}
                          />
                        </label>
                        {editGatewayModal.data.qrCode && (
                          <button
                            type="button"
                            onClick={() => setEditGatewayModal(prev => ({ ...prev, data: { ...prev.data, qrCode: '' } }))}
                            className="block text-[10px] text-red-400 hover:underline"
                          >
                            Remove QR Code
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Status</label>
                    <button
                      type="button"
                      onClick={() => setEditGatewayModal(prev => ({ ...prev, data: { ...prev.data, isActive: !prev.data.isActive } }))}
                      className={`w-full py-2 px-3 rounded-xl font-bold border transition text-center ${
                        editGatewayModal.data.isActive !== false
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-red-500/20 text-red-400 border-red-500/40'
                      }`}
                    >
                      {editGatewayModal.data.isActive !== false ? 'Enabled (Accepting Payments)' : 'Disabled (Hidden from Cashier)'}
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditGatewayModal({ open: false, data: null, saving: false })}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editGatewayModal.saving}
                      className="btn-gold px-5 py-2 font-black uppercase tracking-wider text-xs flex items-center gap-1.5"
                    >
                      {editGatewayModal.saving ? 'Saving...' : 'Save Method Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 3. EDIT PROMO MODAL */}
          {editPromoModal.open && editPromoModal.data && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#10141e] border border-[#ffd700]/40 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/30">
                      <Gift size={18} />
                    </div>
                    <div>
                      <h3 className="font-serif font-black text-base sm:text-lg text-white">Edit Promo Coupon</h3>
                      <p className="text-[11px] text-[#ffd700] font-mono">{editPromoModal.data.code}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditPromoModal({ open: false, data: null, saving: false })}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveEditPromo} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Coupon Code *</label>
                      <input
                        type="text"
                        value={editPromoModal.data.code || ''}
                        onChange={(e) => setEditPromoModal(prev => ({ ...prev, data: { ...prev.data, code: e.target.value.toUpperCase() } }))}
                        required
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700] font-mono uppercase tracking-wider font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Tag</label>
                      <select
                        value={editPromoModal.data.tag || 'EXCLUSIVE'}
                        onChange={(e) => setEditPromoModal(prev => ({ ...prev, data: { ...prev.data, tag: e.target.value } }))}
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                      >
                        <option value="EXCLUSIVE">EXCLUSIVE ⭐</option>
                        <option value="WELCOME">WELCOME BONUS 🎁</option>
                        <option value="FREEPLAY">FREEPLAY DROP 🎰</option>
                        <option value="VIP">VIP ROYAL 👑</option>
                        <option value="FLASH">FLASH DROP ⚡</option>
                        <option value="WEEKEND">WEEKEND BOOST 🔥</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Campaign Headline Title</label>
                    <input
                      type="text"
                      value={editPromoModal.data.title || ''}
                      onChange={(e) => setEditPromoModal(prev => ({ ...prev, data: { ...prev.data, title: e.target.value } }))}
                      className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={editPromoModal.data.description || ''}
                      onChange={(e) => setEditPromoModal(prev => ({ ...prev, data: { ...prev.data, description: e.target.value } }))}
                      className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Reward Dollar Credit ($ USD) *</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.1"
                        value={editPromoModal.data.rewardUSD ?? editPromoModal.data.rewardSC ?? 10}
                        onChange={(e) => setEditPromoModal(prev => ({ ...prev, data: { ...prev.data, rewardUSD: e.target.value, rewardSC: e.target.value } }))}
                        required
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700] font-mono font-bold text-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Min Deposit Required ($ USD)</label>
                      <input
                        type="number"
                        min="0"
                        value={editPromoModal.data.minDeposit ?? 0}
                        onChange={(e) => setEditPromoModal(prev => ({ ...prev, data: { ...prev.data, minDeposit: e.target.value } }))}
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Expiry Date (Optional)</label>
                      <input
                        type="date"
                        value={editPromoModal.data.expiresAt ? editPromoModal.data.expiresAt.split('T')[0] : ''}
                        onChange={(e) => setEditPromoModal(prev => ({ ...prev, data: { ...prev.data, expiresAt: e.target.value } }))}
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Promo Status</label>
                      <button
                        type="button"
                        onClick={() => setEditPromoModal(prev => ({ ...prev, data: { ...prev.data, isActive: !prev.data.isActive } }))}
                        className={`w-full py-2 px-3 rounded-xl font-bold border transition text-center ${
                          editPromoModal.data.isActive !== false
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-red-500/20 text-red-400 border-red-500/40'
                        }`}
                      >
                        {editPromoModal.data.isActive !== false ? 'Active (Claimable)' : 'Paused'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditPromoModal({ open: false, data: null, saving: false })}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editPromoModal.saving}
                      className="btn-gold px-5 py-2 font-black uppercase tracking-wider text-xs flex items-center gap-1.5"
                    >
                      {editPromoModal.saving ? 'Saving...' : 'Save Promo Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 4. EDIT STAFF MODAL */}
          {editStaffModal.open && editStaffModal.data && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#10141e] border border-[#ffd700]/40 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/30">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h3 className="font-serif font-black text-base sm:text-lg text-white">Edit Staff Officer</h3>
                      <p className="text-[11px] text-gray-400 font-mono truncate max-w-[240px] sm:max-w-xs">{editStaffModal.data.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditStaffModal({ open: false, data: null, saving: false })}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveEditStaff} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Username *</label>
                      <input
                        type="text"
                        value={editStaffModal.data.username || ''}
                        onChange={(e) => setEditStaffModal(prev => ({ ...prev, data: { ...prev.data, username: e.target.value } }))}
                        required
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Work Email *</label>
                      <input
                        type="email"
                        value={editStaffModal.data.email || ''}
                        onChange={(e) => setEditStaffModal(prev => ({ ...prev, data: { ...prev.data, email: e.target.value } }))}
                        required
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-300 font-bold block mb-1">RBAC Assigned Role *</label>
                    <select
                      value={editStaffModal.data.role || 'financial_manager'}
                      onChange={(e) => setEditStaffModal(prev => ({ ...prev, data: { ...prev.data, role: e.target.value } }))}
                      className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                    >
                      <option value="operation_admin">Operations Manager</option>
                      <option value="financial_manager">Financial Manager</option>
                      <option value="coin_manager">Coin Allotment Officer</option>
                      <option value="chat_support">Live Chat Support Agent</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Override Officer Password (Leave blank to keep unchanged)</label>
                    <input
                      type="password"
                      placeholder="Enter new password (optional)"
                      value={editStaffModal.data.newPassword || ''}
                      onChange={(e) => setEditStaffModal(prev => ({ ...prev, data: { ...prev.data, newPassword: e.target.value } }))}
                      className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Account Access Status</label>
                    <button
                      type="button"
                      onClick={() => setEditStaffModal(prev => ({ ...prev, data: { ...prev.data, isBanned: !prev.data.isBanned } }))}
                      className={`w-full py-2 px-3 rounded-xl font-bold border transition text-center ${
                        !editStaffModal.data.isBanned
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-red-500/20 text-red-400 border-red-500/40'
                      }`}
                    >
                      {!editStaffModal.data.isBanned ? 'Active (Access Granted)' : 'Suspended (Access Revoked)'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(editStaffModal.data.id || editStaffModal.data._id, editStaffModal.data.username)}
                      className="px-3 py-2 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 text-xs font-bold transition flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Delete Officer
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditStaffModal({ open: false, data: null, saving: false })}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={editStaffModal.saving}
                        className="btn-gold px-5 py-2 font-black uppercase tracking-wider text-xs flex items-center gap-1.5"
                      >
                        {editStaffModal.saving ? 'Saving...' : 'Save Staff Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 5. EDIT PATRON MODAL */}
          {editPatronModal.open && editPatronModal.data && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-[#10141e] border border-[#ffd700]/40 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/30">
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <h3 className="font-serif font-black text-base sm:text-lg text-white">Edit Patron Profile</h3>
                      <p className="text-[11px] text-gray-400 font-mono truncate max-w-[240px] sm:max-w-xs">{editPatronModal.data.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditPatronModal({ open: false, data: null, saving: false })}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSaveEditPatron} className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Username *</label>
                      <input
                        type="text"
                        value={editPatronModal.data.username || ''}
                        onChange={(e) => setEditPatronModal(prev => ({ ...prev, data: { ...prev.data, username: e.target.value } }))}
                        required
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Email Address *</label>
                      <input
                        type="email"
                        value={editPatronModal.data.email || ''}
                        onChange={(e) => setEditPatronModal(prev => ({ ...prev, data: { ...prev.data, email: e.target.value } }))}
                        required
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">KYC Verification Status</label>
                      <select
                        value={editPatronModal.data.kycStatus || 'unverified'}
                        onChange={(e) => setEditPatronModal(prev => ({ ...prev, data: { ...prev.data, kycStatus: e.target.value } }))}
                        className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                      >
                        <option value="unverified">Unverified</option>
                        <option value="pending">Pending Review</option>
                        <option value="approved">Approved Verified</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Account Standing</label>
                      <button
                        type="button"
                        onClick={() => setEditPatronModal(prev => ({ ...prev, data: { ...prev.data, isBanned: !prev.data.isBanned } }))}
                        className={`w-full py-2 px-3 rounded-xl font-bold border transition text-center ${
                          !editPatronModal.data.isBanned
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : 'bg-red-500/20 text-red-400 border-red-500/40'
                        }`}
                      >
                        {!editPatronModal.data.isBanned ? 'Active (Normal)' : 'Banned (Suspended)'}
                      </button>
                    </div>
                  </div>

                  {editPatronModal.data.isBanned && (
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Ban Reason</label>
                      <input
                        type="text"
                        placeholder="e.g., Suspicious activity or terms violation"
                        value={editPatronModal.data.banReason || ''}
                        onChange={(e) => setEditPatronModal(prev => ({ ...prev, data: { ...prev.data, banReason: e.target.value } }))}
                        className="w-full bg-[#07080b] border border-red-500/30 rounded-xl px-3 py-2 text-red-300 outline-none focus:border-red-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Reset Patron Password (Leave blank to keep unchanged)</label>
                    <input
                      type="password"
                      placeholder="Enter new password (minimum 6 chars)"
                      value={editPatronModal.data.newPassword || ''}
                      onChange={(e) => setEditPatronModal(prev => ({ ...prev, data: { ...prev.data, newPassword: e.target.value } }))}
                      className="w-full bg-[#07080b] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-[#ffd700]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        const uid = editPatronModal.data.id || editPatronModal.data._id;
                        setEditPatronModal({ open: false, data: null, saving: false });
                        setSelectedPatronId(uid);
                      }}
                      className="text-xs text-[#ffd700] hover:underline font-bold"
                    >
                      Open Full 360° Profile →
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditPatronModal({ open: false, data: null, saving: false })}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={editPatronModal.saving}
                        className="btn-gold px-5 py-2 font-black uppercase tracking-wider text-xs flex items-center gap-1.5"
                      >
                        {editPatronModal.saving ? 'Saving...' : 'Save Patron Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Patron 360° Profile Modal */}
          {selectedPatronId && (
            <Patron360ProfileModal
              userId={selectedPatronId}
              onClose={() => setSelectedPatronId(null)}
              onUserUpdated={(uid, newBal) => {
                setUsersList(prev => prev.map(item => (item.id === uid || item._id === uid) ? { ...item, balance: newBal, balanceSC: newBal } : item));
              }}
            />
          )}

          {/* Sound & Notification Tune Settings Modal */}
          <SoundSettingsModal
            isOpen={soundModalOpen}
            onClose={() => setSoundModalOpen(false)}
            selectedTune={alertTune}
            onSelectTune={handleSelectTune}
            volume={alertVolume}
            onChangeVolume={handleChangeVolume}
            soundEnabled={audioAlertsEnabled}
            onToggleSound={handleToggleSound}
            onTestToast={(testAlert) => setActiveAlertToast(testAlert)}
          />

          {/* Real-time Incoming Request Toast Notification */}
          <IncomingRequestToast
            alert={activeAlertToast}
            onDismiss={() => setActiveAlertToast(null)}
            onViewRequest={(alert) => {
              if (alert.targetTab) setActiveTab(alert.targetTab);
              if (alert.targetSubTab) setFinanceSubTab(alert.targetSubTab);
            }}
          />

          {/* Admin Chat Full-Screen Image Lightbox Modal */}
          {adminChatPreviewImage && (
            <div
              onClick={() => setAdminChatPreviewImage(null)}
              className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
            >
              <div className="relative max-w-3xl max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setAdminChatPreviewImage(null)}
                  className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
                >
                  <X size={24} />
                </button>
                <img
                  src={adminChatPreviewImage}
                  alt="Enlarged chat attachment"
                  className="max-w-full max-h-[75vh] object-contain rounded-2xl border border-white/20 shadow-2xl"
                />
                <div className="mt-3 flex items-center gap-3">
                  <a
                    href={adminChatPreviewImage}
                    download="chat-attachment.jpg"
                    className="px-4 py-2 rounded-xl btn-gold text-xs font-black flex items-center gap-1.5 shadow-lg"
                  >
                    <Download size={14} />
                    <span>Download Attachment</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setAdminChatPreviewImage(null)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
