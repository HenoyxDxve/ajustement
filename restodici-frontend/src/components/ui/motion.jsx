import { motion, AnimatePresence } from 'framer-motion';

const easeOut = { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.38 };
const spring  = { type: 'spring', stiffness: 400, damping: 28 };

export function FadeIn({ children, delay = 0, y = 16, className, style }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...easeOut, delay }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function StaggerList({ children, className, style, staggerDelay = 0.06 }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: staggerDelay } } }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, style }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0, transition: easeOut } }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({ children, delay = 0, className, style }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...easeOut, delay }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function MotionBtn({ children, onClick, disabled, className, style, type }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={style}
      type={type}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={spring}
    >
      {children}
    </motion.button>
  );
}

export function SlidePanel({ show, children, direction = 'right' }) {
  const x = direction === 'right' ? '100%' : '-100%';
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x, opacity: 0 }}
          transition={easeOut}
          style={{ position: 'absolute', inset: 0, zIndex: 50 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function TabContent({ tabKey, children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tabKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
