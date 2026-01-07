"use client";
import { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './AuthModal.module.css';
import { signInWithGoogle, signInWithPhone, verifyOTP } from '@/lib/auth';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type AuthStep = 'choose' | 'phone-input' | 'otp-input';

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [step, setStep] = useState<AuthStep>('choose');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        const { error } = await signInWithGoogle();
        if (error) {
            setError(error.message);
            setLoading(false);
        }
        // Redirect will happen automatically
    };

    const handleSendOTP = async () => {
        if (!phone.trim()) {
            setError('Please enter a phone number');
            return;
        }
        setLoading(true);
        setError(null);
        const { error } = await signInWithPhone(phone);
        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setStep('otp-input');
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otp.trim()) {
            setError('Please enter the OTP');
            return;
        }
        setLoading(true);
        setError(null);
        const { error } = await verifyOTP(phone, otp);
        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            onClose();
            // Reset state
            setStep('choose');
            setPhone('');
            setOtp('');
        }
    };

    const handleBack = () => {
        setStep('choose');
        setError(null);
        setOtp('');
    };

    const handleClose = () => {
        onClose();
        // Reset state on close
        setStep('choose');
        setPhone('');
        setOtp('');
        setError(null);
    };

    if (!isOpen) return null;

    const content = (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={handleClose}>×</button>

                <div className={styles.header}>
                    <h2>Welcome to Shywarma</h2>
                    <p>Sign in to save your itineraries and preferences</p>
                </div>

                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                {step === 'choose' && (
                    <div className={styles.options}>
                        <button
                            className={styles.googleBtn}
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                        >
                            <svg viewBox="0 0 24 24" width="20" height="20">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        <div className={styles.divider}>
                            <span>or</span>
                        </div>

                        <button
                            className={styles.phoneBtn}
                            onClick={() => setStep('phone-input')}
                            disabled={loading}
                        >
                            📱 Continue with Phone
                        </button>
                    </div>
                )}

                {step === 'phone-input' && (
                    <div className={styles.phoneForm}>
                        <button className={styles.backBtn} onClick={handleBack}>
                            ← Back
                        </button>
                        <label>Phone Number</label>
                        <input
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className={styles.input}
                        />
                        <p className={styles.hint}>Include country code (e.g., +91 for India)</p>
                        <button
                            className={styles.primaryBtn}
                            onClick={handleSendOTP}
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </div>
                )}

                {step === 'otp-input' && (
                    <div className={styles.phoneForm}>
                        <button className={styles.backBtn} onClick={handleBack}>
                            ← Back
                        </button>
                        <label>Verification Code</label>
                        <input
                            type="text"
                            placeholder="Enter 6-digit OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className={styles.input}
                            maxLength={6}
                        />
                        <p className={styles.hint}>Sent to {phone}</p>
                        <button
                            className={styles.primaryBtn}
                            onClick={handleVerifyOTP}
                            disabled={loading}
                        >
                            {loading ? 'Verifying...' : 'Verify & Sign In'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );

    if (typeof window === 'undefined') return null;
    return createPortal(content, document.body);
}
