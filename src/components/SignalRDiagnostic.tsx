/**
 * SignalR Diagnostic Component
 * Để test và debug SignalR connection
 * 
 * Usage:
 * 1. Import component: import SignalRDiagnostic from '@/components/SignalRDiagnostic'
 * 2. Add to page: <SignalRDiagnostic />
 * 3. Check console logs và UI status
 */

import { useState, useEffect } from 'react'
import { Box, Paper, Typography, Chip, Button, Stack, Alert } from '@mui/material'
import { signalRService } from '@/services/signalrService'
import { useSignalR, useSignalRReconnect } from '@/hooks/useSignalR'
import { HubConnectionState } from '@microsoft/signalr'

const SignalRDiagnostic = () => {
  const [connectionState, setConnectionState] = useState<HubConnectionState>(HubConnectionState.Disconnected)
  const [eventLogs, setEventLogs] = useState<string[]>([])
  const [lastEvent, setLastEvent] = useState<Record<string, unknown> | null>(null)

  // Monitor connection state
  useEffect(() => {
    const interval = setInterval(() => {
      const state = signalRService.getState()
      setConnectionState(state)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Listen to all events
  useSignalR({
    onInvoiceChanged: (payload) => {
      const log = `📨 InvoiceChanged: ID=${payload.invoiceId}, Type=${payload.changeType}`
      setEventLogs(prev => [log, ...prev].slice(0, 10))
      setLastEvent({ type: 'InvoiceChanged', ...payload })
      console.log('🔔 [Diagnostic] InvoiceChanged:', payload)
    },
    onUserChanged: (payload) => {
      const log = `📨 UserChanged: ID=${payload.userId}, Type=${payload.changeType}`
      setEventLogs(prev => [log, ...prev].slice(0, 10))
      setLastEvent({ type: 'UserChanged', ...payload })
      console.log('🔔 [Diagnostic] UserChanged:', payload)
    },
    onDashboardChanged: (payload) => {
      const log = `📨 DashboardChanged: Scope=${payload.scope}, Type=${payload.changeType}`
      setEventLogs(prev => [log, ...prev].slice(0, 10))
      setLastEvent({ type: 'DashboardChanged', ...payload })
      console.log('🔔 [Diagnostic] DashboardChanged:', payload)
    }
  })

  useSignalRReconnect(() => {
    const log = '🔄 SignalR Reconnected!'
    setEventLogs(prev => [log, ...prev].slice(0, 10))
    console.log('🔔 [Diagnostic] Reconnected')
  })

  const handleManualReconnect = async () => {
    try {
      await signalRService.reconnect()
      setEventLogs(prev => ['✅ Manual reconnect successful', ...prev].slice(0, 10))
    } catch (error) {
      setEventLogs(prev => [`❌ Manual reconnect failed: ${error}`, ...prev].slice(0, 10))
    }
  }

  const getStateColor = () => {
    switch (connectionState) {
      case HubConnectionState.Connected:
        return 'success'
      case HubConnectionState.Connecting:
        return 'warning'
      case HubConnectionState.Reconnecting:
        return 'warning'
      case HubConnectionState.Disconnected:
        return 'error'
      default:
        return 'default'
    }
  }

  const getStateLabel = () => {
    switch (connectionState) {
      case HubConnectionState.Connected:
        return '✅ Connected'
      case HubConnectionState.Connecting:
        return '🔄 Connecting...'
      case HubConnectionState.Reconnecting:
        return '🔄 Reconnecting...'
      case HubConnectionState.Disconnected:
        return '❌ Disconnected'
      default:
        return '❓ Unknown'
    }
  }

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 400,
        maxHeight: 600,
        overflow: 'auto',
        p: 2,
        zIndex: 9999,
        boxShadow: 4,
      }}
    >
      <Typography variant="h6" gutterBottom>
        🔍 SignalR Diagnostic
      </Typography>

      {/* Connection Status */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Connection Status:
        </Typography>
        <Chip label={getStateLabel()} color={getStateColor()} />
      </Box>

      {/* Actions */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button size="small" variant="outlined" onClick={handleManualReconnect}>
          Reconnect
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => setEventLogs([])}
        >
          Clear Logs
        </Button>
      </Stack>

      {/* Instructions */}
      {connectionState === HubConnectionState.Disconnected && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Backend chưa enable SignalR Hub!</strong>
            <br />
            1. Check console logs (F12)
            <br />
            2. Verify backend endpoint: <code>/hubs/notifications</code>
            <br />
            3. Read: <code>docs/SIGNALR_BACKEND_REQUIREMENTS.md</code>
          </Typography>
        </Alert>
      )}

      {connectionState === HubConnectionState.Connected && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>✅ SignalR Connected!</strong>
            <br />
            Waiting for events from backend...
          </Typography>
        </Alert>
      )}

      {/* Last Event */}
      {lastEvent && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Last Event:
          </Typography>
          <Paper variant="outlined" sx={{ p: 1, bgcolor: 'grey.50' }}>
            <pre style={{ margin: 0, fontSize: 11, overflow: 'auto' }}>
              {JSON.stringify(lastEvent, null, 2)}
            </pre>
          </Paper>
        </Box>
      )}

      {/* Event Logs */}
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Recent Events ({eventLogs.length}):
        </Typography>
        {eventLogs.length === 0 ? (
          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
            No events yet...
          </Typography>
        ) : (
          <Stack spacing={0.5}>
            {eventLogs.map((log, index) => (
              <Typography key={index} variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                {log}
              </Typography>
            ))}
          </Stack>
        )}
      </Box>

      {/* Help */}
      <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          💡 Tip: Open browser console (F12) để xem detailed logs
        </Typography>
      </Box>
    </Paper>
  )
}

export default SignalRDiagnostic
