import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, X, Plus, CheckCircle2, Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';
import { walletService } from '../../services/walletService';
import { useTranslation } from '../../services/languageService';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newBalance: number) => void;
  suggestedAmount?: number;
}

export const AddMoneyModal: React.FC<AddMoneyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  suggestedAmount,
}) => {
  const { t } = useTranslation();
  const [balance, setBalance] = useState<number>(walletService.getBalance());
  const [selectedAmount, setSelectedAmount] = useState<number>(suggestedAmount || 200);
  const [customAmountStr, setCustomAmountStr] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const presetAmounts = [100, 200, 500, 1000];

  useEffect(() => {
    if (isOpen) {
      setBalance(walletService.getBalance());
      if (suggestedAmount && suggestedAmount > 0) {
        setSelectedAmount(suggestedAmount);
        setIsCustom(false);
      }
      setSuccessMessage(null);
    }
  }, [isOpen, suggestedAmount]);

  useEffect(() => {
    const unsubscribe = walletService.subscribe((newBal) => {
      setBalance(newBal);
    });
    return unsubscribe;
  }, []);

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmountStr('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmountStr(val);
    setIsCustom(true);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setSelectedAmount(num);
    } else {
      setSelectedAmount(0);
    }
  };

  const handleDeposit = async () => {
    const amountToDeposit = isCustom ? (parseInt(customAmountStr, 10) || 0) : selectedAmount;
    if (amountToDeposit <= 0) return;

    setIsProcessing(true);
    // Simulate brief network delay for polish
    await new Promise(r => setTimeout(r, 400));

    const result = await walletService.addMoney(amountToDeposit);
    setIsProcessing(false);

    if (result.success) {
      setSuccessMessage(result.message);
      if (onSuccess) {
        onSuccess(result.newBalance);
      }
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 1200);
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
          className="w-full max-w-md bg-[#0c1222] border border-amber-500/30 rounded-3xl p-5 shadow-2xl space-y-4 text-slate-100 relative overflow-hidden"
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
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-md shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-[#0c1222] rounded-[14px] flex items-center justify-center text-amber-300">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-slate-100 flex items-center gap-1.5">
                <span>{t('addDemoMoney')}</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-[11px] text-slate-400">
                {t('walletBalance')}: <span className="text-amber-300 font-bold">₹{balance.toFixed(2)}</span>
              </p>
            </div>
          </div>

          {/* Prototype Notice Banner */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-[11px] text-amber-200">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-amber-300 text-[10px] uppercase tracking-wider">
                Simulated Prototype Top-Up
              </span>
              <span>{t('simulatedTopupNotice')}</span>
            </div>
          </div>

          {/* Success State Overlay */}
          {successMessage ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-8 flex flex-col items-center justify-center text-center space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-serif font-bold text-slate-100">{t('depositSuccess')}</h4>
              <p className="text-xs text-amber-300 font-semibold">{successMessage}</p>
            </motion.div>
          ) : (
            <>
              {/* Select Top-Up Amount */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>{t('selectTopupAmount')}</span>
                  {suggestedAmount && (
                    <span className="text-[10px] text-amber-300 font-normal">
                      Recommended: ₹{suggestedAmount}
                    </span>
                  )}
                </label>

                {/* Preset Chips */}
                <div className="grid grid-cols-4 gap-2">
                  {presetAmounts.map((amt) => {
                    const isSelected = !isCustom && selectedAmount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleSelectPreset(amt)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                            : 'bg-[#16203c] text-slate-200 border-amber-500/20 hover:border-amber-400/40 hover:bg-[#1e2b4f]'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount Input */}
                <div className="pt-1">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">
                      ₹
                    </span>
                    <input
                      type="text"
                      placeholder={t('customAmount')}
                      value={customAmountStr}
                      onChange={handleCustomChange}
                      className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-[#16203c] border ${
                        isCustom
                          ? 'border-amber-400 text-amber-300 font-bold'
                          : 'border-amber-500/20 text-slate-200 hover:border-amber-400/40'
                      } focus:outline-none focus:border-amber-400 transition-colors`}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Summary */}
              <div className="p-3 rounded-xl bg-[#16203c]/60 border border-slate-700/50 flex items-center justify-between text-xs">
                <span className="text-slate-400">{t('availableBalance')}:</span>
                <span className="text-slate-200 font-semibold">₹{balance.toFixed(2)}</span>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleDeposit}
                disabled={isProcessing || selectedAmount <= 0}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>{t('depositNow')} (₹{selectedAmount || 0})</span>
                  </>
                )}
              </button>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
