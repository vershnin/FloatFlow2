import { useNetworkStatus } from '@/hooks/use-network';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function NetworkStatusIndicator() {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Alert className="border-destructive bg-destructive/10 max-w-md">
            <WifiOff className="h-4 w-4" />
            <AlertDescription className="flex items-center gap-2">
              <span>You are currently offline. Some features may not be available.</span>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {isOnline && isSlowConnection && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Alert className="border-yellow-500 bg-yellow-500/10 max-w-md">
            <Clock className="h-4 w-4" />
            <AlertDescription className="flex items-center gap-2">
              <span>Slow connection detected. Some operations may take longer.</span>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
}