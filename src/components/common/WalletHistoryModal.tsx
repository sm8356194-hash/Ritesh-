import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet, ArrowUpRight, ArrowDownRight, Calendar, Info, Sparkles, CheckCircle2 } from 'lucide-react';
import { walletService, WalletTransaction } from '../../services/walletService';
import { useTranslation } from '../../services/languageService';

interface WalletHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletHistoryModal: React.FC<WalletHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const [balance, setBalance] = useState<number>(walletService.getBalance());
  const [transactions, setTransactions] = useState<WalletTransaction[]>(walletService.getTransactions());

  useEffect(() => {
    if (isOpen) {
      setBalance(walletService.getBalance());
      setTransactions(walletService.getTransactions());
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubBal = walletService.subscribe((bal) => setBalance(bal));
    const unsubTx = walletService.subscribeTransactions((txs) => setTransactions(txs));
    return () => {
      unsubBal();
      unsubTx();
    };
  }, []);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-md bg-[#0c1222] border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100 relative overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Top Glow Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-[#16203c] hover:bg-[#1e2b4f] text-slate-400 hover:text-slate-200 transition-colors z-10"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-md shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-[#0c1222] rounded-[14px] flex items-center justify-center text-amber-300">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-slate-100 flex items-center gap-1.5">
                <span>{t('walletHistory')}</span>
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </h3>
              <p className="text-[11px] text-slate-400">
                {t('availableBalance')}: <span className="text-amber-300 font-bold">₹{balance.toFixed(2)}</span>
              </p>
            </div>
          </div>

          {/* Simulated Notice */}
          <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2 text-[10px] text-amber-200 shrink-0">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-amber-300 uppercase tracking-wider text-[9px]">
                Demo Ledger View
              </span>
              <span>All deposits & debits shown are simulated prototype data. No real billing or payment processing has been executed.</span>
            </div>
          </div>

          {/* Transaction List Container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[200px]">
            {transactions.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-[#16203c] flex items-center justify-center text-slate-500">
                  <Wallet className="w-6 h-6 text-slate-500" />
                </div>
                <p className="text-xs font-semibold">{t('noTransactions')}</p>
                <p className="text-[10px] text-slate-500 max-w-[200px]">
                  Use the "Add Money" option on the home screen to deposit demo wallet funds.
                </p>
              </div>
            ) : (
              transactions.map((tx) => {
                const isCredit = tx.type === 'CREDIT';
                return (
                  <div
                    key={tx.transactionId}
                    className="p-3 rounded-2xl bg-[#16203c]/60 border border-slate-800 hover:border-slate-700/60 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                        isCredit 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-[#0c1222] text-amber-300 border-amber-500/20'
                      }`}>
                        {isCredit ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4" />
                        )}
                      </div>

                      {/* Detail Column */}
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-200 block text-xs">
                          {tx.description === 'Wallet Top-Up (Demo)' ? t('walletTopup') : (tx.description === 'Consultation Payment' ? t('consultationPayment') : tx.description)}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{formatDate(tx.timestamp)}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-mono block">
                          ID: {tx.transactionId}
                        </span>
                      </div>
                    </div>

                    {/* Amount & Balance Column */}
                    <div className="text-right shrink-0">
                      <span className={`font-mono font-bold block text-sm ${
                        isCredit ? 'text-emerald-400' : 'text-slate-100'
                      }`}>
                        {isCredit ? '+' : '-'} ₹{tx.amount.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {t('balanceAfter')}: <strong className="font-mono text-amber-300 font-semibold">₹{tx.balanceAfter.toFixed(2)}</strong>
                      </span>
                      <span className="inline-block text-[8px] bg-amber-400/10 text-amber-300 px-1 py-0.2 rounded border border-amber-400/20 font-medium scale-95 origin-right">
                        {t('demoTransaction')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Action */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#16203c] hover:bg-[#1e2b4f] text-slate-200 font-bold text-xs transition-colors shrink-0"
          >
            Close
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
