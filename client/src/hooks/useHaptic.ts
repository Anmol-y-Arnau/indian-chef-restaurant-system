import { useCallback } from 'react';

/**
 * Hook para gestionar feedback háptico (vibración) en dispositivos móviles
 * 
 * Patrones de vibración:
 * - light: Vibración suave para acciones menores (añadir item, cambiar categoría)
 * - medium: Vibración media para acciones importantes (eliminar item, confirmar)
 * - heavy: Vibración fuerte para acciones críticas (completar pago, cerrar mesa)
 * - success: Patrón de éxito (dos vibraciones cortas)
 * - error: Patrón de error (vibración larga)
 * - selection: Vibración muy corta para selección (cambiar mesa, tab)
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,           // 10ms - muy suave
  selection: 5,        // 5ms - casi imperceptible
  medium: 20,          // 20ms - notable
  heavy: 50,           // 50ms - fuerte
  success: [10, 50, 10], // patrón: corta-pausa-corta
  error: 100,          // 100ms - vibración larga de error
};

export function useHaptic() {
  const vibrate = useCallback((pattern: HapticPattern) => {
    // Verificar si el navegador soporta Vibration API
    if (!navigator.vibrate) {
      // Silently fail en navegadores que no soportan vibración
      return;
    }

    const vibrationPattern = HAPTIC_PATTERNS[pattern];
    
    try {
      navigator.vibrate(vibrationPattern);
    } catch (error) {
      // Silently fail si hay algún error
      console.debug('Haptic feedback not available:', error);
    }
  }, []);

  return {
    vibrate,
    // Métodos de conveniencia
    light: useCallback(() => vibrate('light'), [vibrate]),
    medium: useCallback(() => vibrate('medium'), [vibrate]),
    heavy: useCallback(() => vibrate('heavy'), [vibrate]),
    success: useCallback(() => vibrate('success'), [vibrate]),
    error: useCallback(() => vibrate('error'), [vibrate]),
    selection: useCallback(() => vibrate('selection'), [vibrate]),
  };
}
