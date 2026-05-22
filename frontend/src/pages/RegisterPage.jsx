import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BrandLogo from '../components/BrandLogo.jsx';
import { authApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { fadeUp, staggerContainer } from '../motion/presets.js';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { refreshAuth, profileComplete } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    try {
      await authApi.register({ email, password });
      await refreshAuth();
      navigate(profileComplete ? '/' : '/profile');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    }
  }

  return (
    <motion.div
      className="mx-auto max-w-md px-4 py-16"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp}>
        <BrandLogo variant="auth" />
      </motion.div>
      <motion.h1 variants={fadeUp} className="mt-8 text-2xl font-bold text-slate-100">
        Create your account
      </motion.h1>
      <motion.form variants={fadeUp} className="mt-8 space-y-4" onSubmit={submit}>
        <motion.input
          className="field-control"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          whileFocus={{ scale: 1.01, borderColor: 'rgba(34,211,238,0.5)' }}
        />
        <motion.input
          className="field-control"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          whileFocus={{ scale: 1.01, borderColor: 'rgba(34,211,238,0.5)' }}
        />
        <motion.button
          type="submit"
          className="btn-primary w-full"
          whileHover={{ scale: 1.02, boxShadow: '0 0 28px rgba(34,211,238,0.35)' }}
          whileTap={{ scale: 0.98 }}
        >
          Register
        </motion.button>
      </motion.form>
      <AnimatePresence>
        {error && (
          <motion.p
            className="mt-4 text-sm text-red-300"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      <motion.p variants={fadeUp} className="mt-8 text-center text-sm">
        <Link to="/login" className="link-accent">
          Log in
        </Link>
      </motion.p>
    </motion.div>
  );
}
