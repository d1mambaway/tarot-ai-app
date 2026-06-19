'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/app-store';
import { hapticLight, hapticSuccess } from '@/lib/haptics';

type L = 'ru' | 'uk' | 'en';

const T = {
  title: { ru: 'Поддержка', uk: 'Підтримка', en: 'Support' },
  subtitle: {
    ru: 'Опишите вашу проблему или вопрос',
    uk: 'Опишіть вашу проблему або питання',
    en: 'Describe your issue or question',
  },
  placeholder: {
    ru: 'Напишите сообщение...',
    uk: 'Напишіть повідомлення...',
    en: 'Write your message...',
  },
  send: { ru: 'Отправить', uk: 'Відправити', en: 'Send' },
  sending: { ru: 'Отправка...', uk: 'Відправка...', en: 'Sending...' },
  sent: {
    ru: '✅ Сообщение отправлено! Мы ответим вам в ближайшее время.',
    uk: '✅ Повідомлення надіслано! Ми відповімо вам найближчим часом.',
    en: '✅ Message sent! We will reply shortly.',
  },
  error: {
    ru: '❌ Ошибка отправки. Попробуйте позже.',
    uk: '❌ Помилка надсилання. Спробуйте пізніше.',
    en: '❌ Failed to send. Try again later.',
  },
  close: { ru: 'Закрыть', uk: 'Закрити', en: 'Close' },
};

interface SupportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SupportModal({ open, onClose }: SupportModalProps) {
  const { locale } = useAppStore();
  const l = (locale || 'ru') as L;
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setMessage('');
      setStatus('idle');
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSend = async () => {
    if (!message.trim() || status === 'sending') return;
    hapticLight();
    setStatus('sending');
    const tg = (window as any).Telegram?.WebApp;
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initData: tg?.initData || '',
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus('sent');
        hapticSuccess();
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md rounded-t-3xl bg-mystic-card border-t border-mystic-accent/30 p-5 pb-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-mystic-accent font-mystic">
                💬 {T.title[l]}
              </h2>
              <button
                onClick={onClose}
                className="text-mystic-muted text-sm hover:text-mystic-accent transition-colors"
              >
                {T.close[l]}
              </button>
            </div>

            {status === 'sent' ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <p className="text-green-400 text-sm">{T.sent[l]}</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-6 py-2 rounded-xl bg-mystic-accent/20 text-mystic-accent text-sm"
                >
                  {T.close[l]}
                </button>
              </motion.div>
            ) : (
              <>
                <p className="text-xs text-mystic-muted mb-3">{T.subtitle[l]}</p>

                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={T.placeholder[l]}
                  rows={4}
                  maxLength={1000}
                  className="w-full rounded-xl bg-mystic-bg/50 border border-mystic-accent/20 p-3 text-sm text-mystic-text placeholder-mystic-muted/50 focus:outline-none focus:border-mystic-accent/50 resize-none"
                />

                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-mystic-muted">{message.length}/1000</span>
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || status === 'sending'}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-mystic-purple to-mystic-accent text-white text-sm font-medium disabled:opacity-40 transition-opacity"
                  >
                    {status === 'sending' ? T.sending[l] : T.send[l]}
                  </button>
                </div>

                {status === 'error' && (
                  <p className="text-red-400 text-xs mt-2 text-center">{T.error[l]}</p>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
