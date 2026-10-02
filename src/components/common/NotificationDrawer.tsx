import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, X, Sparkles, AlertCircle, CheckCircle2, Clock, CreditCard, DollarSign, Calendar } from 'lucide-react';
import { InAppNotification } from '../../types';
import { notificationService } from '../../services/notification/notificationService';
import { authService } from '../../services/auth/authService';
import { languageService } from '../../services/languageService';
import { fcmClientService, FCMClientStatus } from '../../services/notification/fcmClientService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRelatedEntity?: (entityType: string, entityId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onSelectRelatedEntity,
}) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState(languageService.getLanguage());

  // FCM state variables
  const [pushStatus, setPushStatus] = useState<FCMClientStatus>(fcmClientService.getStatus());
  const [pushLoading, setPushLoading] = useState<boolean>(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('fcm_push_token') : null;
  });

  useEffect(() => {
    return languageService.subscribe(l => setLang(l));
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      // Synchronize status when drawer is opened
      setPushStatus(fcmClientService.getStatus());
    }
  }, [isOpen]);

  const handleEnablePush = async () => {
    setPushLoading(true);
    setPushError(null);
    
    const result = await fcmClientService.requestPermissionAndRegister();
    setPushLoading(false);
    setPushStatus(result.status);
    
    if (result.success && result.token) {
      setPushToken(result.token);
      localStorage.setItem('fcm_push_token', result.token);
    } else if (result.error) {
      setPushError(result.error);
    }
  };

  const handleDisablePush = async () => {
    if (pushToken) {
      setPushLoading(true);
      await fcmClientService.disableNotifications(pushToken);
      setPushToken(null);
      localStorage.removeItem('fcm_push_token');
      setPushLoading(false);
    }
    setPushStatus(fcmClientService.getStatus());
  };

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    const user = authService.getCurrentUser();
    if (!user) {
      setError('Please log in to view notifications.');
      setLoading(false);
      return;
    }

    const res = await notificationService.listNotificationsForUser(user, user.id, 30);
    setLoading(false);
    if (res.success) {
      setNotifications(res.data);
    } else {
      setError(res.error);
    }
  };

  const handleMarkAsRead = async (notifId: string) => {
    const user = authService.getCurrentUser();
    if (!user) return;
    const res = await notificationService.markAsRead(user, notifId);
    if (res.success) {
      setNotifications(prev =>
        prev.map(n => (n.id === notifId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const user = authService.getCurrentUser();
    if (!user) return;
    const res = await notificationService.markAllAsRead(user);
    if (res.success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true, readAt: n.readAt || new Date().toISOString() }))
      );
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + d.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  const getIconForType = (type: string) => {
    if (type.startsWith('PAYMENT')) return <CreditCard className="w-4 h-4 text-emerald-400" />;
    if (type.startsWith('PAYOUT')) return <DollarSign className="w-4 h-4 text-amber-400" />;
    return <Calendar className="w-4 h-4 text-blue-400" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-[#0c1222] border-l border-amber-500/30 flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#1e2b4f] flex items-center justify-between bg-[#10182e]">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300">
              <Bell className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-serif font-bold text-slate-100 flex items-center gap-1.5">
                <span>{lang === 'hi' ? 'सूचनाएं' : 'In-App Notifications'}</span>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
                    {notifications.filter(n => !n.isRead).length} {lang === 'hi' ? 'नया' : 'new'}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                {lang === 'hi' ? 'रियल-टाइम परामर्श, भुगतान और पेआउट अलर्ट' : 'Real-time updates & activity alerts'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.some(n => !n.isRead) && (
              <button
                onClick={handleMarkAllAsRead}
                className="p-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-xs font-semibold flex items-center gap-1 border border-amber-400/20 transition-all"
                title={lang === 'hi' ? 'सभी को पढ़ा हुआ चिन्हित करें' : 'Mark all as read'}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'hi' ? 'सब पढ़ें' : 'Mark all read'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-[#1a2542] text-slate-400 hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Push Notification Toggle Card */}
        <div className="p-4 bg-[#11192e] border-b border-[#1e2b4f]/70 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{lang === 'hi' ? 'पुश सूचनाएं (FCM)' : 'FCM Push Alerts'}</span>
            </div>
            <span className={`text-[10px] uppercase tracking-wider font-mono font-bold px-2 py-0.5 rounded-full border ${
              pushStatus === 'REGISTERED' 
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {pushStatus === 'REGISTERED' ? (lang === 'hi' ? 'सक्रिय' : 'Active') : (lang === 'hi' ? 'निष्क्रिय' : 'Inactive')}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {lang === 'hi'
              ? 'डिवाइस लॉक होने पर भी नए परामर्श अनुरोध, चैट संदेश और भुगतान अलर्ट तुरंत प्राप्त करें।'
              : 'Receive real-time push alerts on your device for bookings, new chat messages, and payment status updates.'}
          </p>

          {pushError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[10px] flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{pushError}</span>
            </div>
          )}

          {pushStatus === 'SANDBOXED' ? (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] leading-relaxed">
              {lang === 'hi'
                ? 'आईफ्रेम सैंडबॉक्स सीमा: कृपया वास्तविक पुश अलर्ट का परीक्षण करने के लिए सीधे साझा ऐप यूआरएल का उपयोग करें।'
                : 'Iframe Sandbox Notice: AI Studio blocks notifications inside workspace previews. Test actual push alerts directly via the Shared App URL.'}
            </div>
          ) : pushStatus === 'PERMISSION_DENIED' ? (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] leading-relaxed">
              {lang === 'hi'
                ? 'पुश अलर्ट ब्राउज़र में ब्लॉक हैं। कृपया एड्रेस बार में लॉक आइकन पर क्लिक करके अनुमति रीसेट करें।'
                : 'Push alerts are blocked. Please click the lock icon in your browser address bar to reset permissions.'}
            </div>
          ) : pushStatus === 'REGISTERED' ? (
            <button
              onClick={handleDisablePush}
              className="w-full py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-semibold text-[11px] border border-rose-500/30 transition-all cursor-pointer"
            >
              {lang === 'hi' ? 'पुश सूचनाएं अक्षम करें' : 'Disable Push Alerts'}
            </button>
          ) : (
            <button
              onClick={handleEnablePush}
              disabled={pushLoading}
              className="w-full py-2 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {pushLoading ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  <span>{lang === 'hi' ? 'सक्रिय किया जा रहा है...' : 'Enabling Push Alerts...'}</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5 text-slate-950" />
                  <span>{lang === 'hi' ? 'पुश अलर्ट सक्षम करें' : 'Enable Push Alerts'}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Notifications Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Clock className="w-6 h-6 animate-spin mx-auto text-amber-400/80" />
              <p className="text-xs">{lang === 'hi' ? 'सूचनाएं लोड हो रही हैं...' : 'Loading notifications...'}</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center mx-auto text-amber-400">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-slate-300">
                {lang === 'hi' ? 'कोई नई सूचनाएं नहीं हैं' : 'No notifications yet'}
              </p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                {lang === 'hi'
                  ? 'परामर्श अनुरोधों, भुगतान पुष्टियों और निपटान स्थिति में बदलाव के लिए आपको यहां अलर्ट प्राप्त होंगे।'
                  : 'You will receive real-time updates here for bookings, payment verifications, and settlement status changes.'}
              </p>
            </div>
          ) : (
            notifications.map(notif => {
              const title = lang === 'hi' && notif.titleHi ? notif.titleHi : notif.title;
              const message = lang === 'hi' && notif.messageHi ? notif.messageHi : notif.message;

              return (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (!notif.isRead) handleMarkAsRead(notif.id);
                    if (notif.relatedEntityId && notif.relatedEntityType && onSelectRelatedEntity) {
                      onSelectRelatedEntity(notif.relatedEntityType, notif.relatedEntityId);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                    notif.isRead
                      ? 'bg-[#0f172a]/60 border-[#1e293b] text-slate-300 hover:border-amber-500/30'
                      : 'bg-gradient-to-r from-[#131d35] to-[#111827] border-amber-500/40 text-slate-100 shadow-md shadow-amber-500/5 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      notif.isRead ? 'bg-slate-800 text-slate-400' : 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
                    }`}>
                      {getIconForType(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`text-xs font-semibold truncate ${notif.isRead ? 'text-slate-300' : 'text-slate-100 font-bold'}`}>
                          {title}
                        </h3>
                        {!notif.isRead && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                        {message}
                      </p>

                      <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatTime(notif.createdAt)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
