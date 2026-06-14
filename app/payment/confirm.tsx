import { useEffect, useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, Switch, Alert, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Order, PaymentInfo } from '@/types';
import * as SecureStore from 'expo-secure-store';

export default function PaymentConfirmScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams() as { orderId?: string };
  const { user, activeOrders } = useStore();
  const colorScheme = useColorScheme();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile'>('cash');
  const [tipAmount, setTipAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [amountPaid, setAmountPaid] = useState(0);

  useEffect(() => {
    if (!orderId) return;
    
    const foundOrder = activeOrders.find(o => o.id === orderId);
    if (foundOrder) {
      setOrder(foundOrder);
    } else {
      setTimeout(() => {
        const mockOrder: Order = {
          id: orderId,
          tableId: '1',
          items: [
            { id: '1', menuItemId: '1', quantity: 2, name: 'Caesar Salad', price: 12.99 },
            { id: '2', menuItemId: '2', quantity: 1, name: 'Grilled Salmon', price: 24.99 }
          ],
          status: 'ready',
          total: 50.97,
          createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 60000).toISOString()
        };
        setOrder(mockOrder);
      }, 500);
    }
  }, [orderId, activeOrders]);

  const calculateTotal = () => {
    if (!order) return 0;
    return order.total + tipAmount;
  };

  const handleProcessPayment = async () => {
    if (!order) return;
    
    setIsProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const updatedOrder = { ...order, status: 'paid' };
      setOrder(updatedOrder);
      
      const paymentInfo: PaymentInfo = {
        orderId: order.id,
        amount: order.total,
        tip: tipAmount,
        total: calculateTotal(),
        paymentMethod,
        status: 'completed'
      };
      
      await SecureStore.setItemAsync(`payment_${order.id}`, JSON.stringify(paymentInfo));
      
      setAmountPaid(calculateTotal());
      setShowReceipt(true);
    } catch (error) {
      console.error('Payment processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    Alert.alert('Receipt sent to printer');
  };

  const handleDone = () => {
    router.replace('/(tabs)/tables');
  };

  if (!order) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <ThemedText style={styles.loadingText}>Loading order...</ThemedText>
      </ThemedView>
    );
  }

  if (showReceipt) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.successCard}>
          <IconSymbol name="checkmark.circle.fill" size={48} color={Colors[colorScheme ?? 'light'].success || '#4CAF50'} />
          <ThemedText type="title" style={styles.successTitle}>
            Payment Successful!
          </ThemedText>
          <ThemedText style={styles.successSubtitle}>
            Thank you for your payment
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Receipt Details</ThemedText>
          <View style={styles.receiptCard}>
            <View style={styles.receiptRow}>
              <ThemedText>Order #:</ThemedText>
              <ThemedText>{order.id}</ThemedText>
            </View>
            <View style={styles.receiptRow}>
              <ThemedText>Date:</ThemedText>
              <ThemedText>{new Date().toLocaleDateString()}</ThemedText>
            </View>
            <View style={styles.receiptRow}>
              <ThemedText>Time:</ThemedText>
              <ThemedText>{new Date().toLocaleTimeString()}</ThemedText>
            </View>
            <View style={styles.receiptRow}>
              <ThemedText>Table:</ThemedText>
              <ThemedText>#{order.tableId}</ThemedText>
            </View>
            <View style={styles.receiptRow}>
              <ThemedText>Payment Method:</ThemedText>
              <ThemedText>
                {paymentMethod === 'cash' ? 'Cash' : 
                 paymentMethod === 'card' ? 'Credit/Debit Card' : 
                 'Mobile Payment'}
              </ThemedText>
            </View>
          </View>
        </ThemedView>
        
        <ThemedView style={styles.totalCard}>
          <View style={styles.totalRow}>
            <ThemedText>Subtotal:</ThemedText>
            <ThemedText>${order.total.toFixed(2)}</ThemedText>
          </View>
          {tipAmount > 0 && (
            <View style={styles.totalRow}>
              <ThemedText>Tip:</ThemedText>
              <ThemedText>${tipAmount.toFixed(2)}</ThemedText>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <ThemedText type="title">Total:</ThemedText>
            <ThemedText type="title">${amountPaid.toFixed(2)}</ThemedText>
          </View>
        </ThemedView>
        
        <ThemedView style={styles.actionButtons}>
          <TouchableOpacity 
            onPress={handlePrintReceipt}
            style={styles.printButton}
          >
            <ThemedText style={styles.printButtonText}>
              Print Receipt
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleDone}
            style={styles.doneButton}
          >
            <ThemedText style={styles.doneButtonText}>
              Done
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>
          Payment Confirmation
        </ThemedText>
        <ThemedText style={styles.headerTable}>
          Table #{order.tableId}
        </ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.content}>
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Order Summary</ThemedText>
          <View style={styles.orderCard}>
            {order.items.map((item, index) => (
              <View key={index} style={styles.orderItemRow}>
                <ThemedText>
                  {item.name} x{item.quantity}
                </ThemedText>
                <ThemedText>
                  ${(item.price * item.quantity).toFixed(2)}
                </ThemedText>
              </View>
            ))}
            <View style={styles.orderTotalRow}>
              <ThemedText>Order Total:</ThemedText>
              <ThemedText type="defaultSemiBold">${order.total.toFixed(2)}</ThemedText>
            </View>
          </View>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Payment Method</ThemedText>
          <View style={styles.paymentCard}>
            <View style={styles.paymentRow}>
              <ThemedText>Cash</ThemedText>
              <Switch
                value={paymentMethod === 'cash'}
                onValueChange={(value) => value && setPaymentMethod('cash')}
                thumbColor={Colors[colorScheme ?? 'light'].tint}
                trackColor={{ 
                  false: Colors[colorScheme ?? 'light'].border || '#ccc',
                  true: Colors[colorScheme ?? 'light'].success || '#4CAF50' 
                }}
              />
            </View>
            <View style={styles.paymentRow}>
              <ThemedText>Card</ThemedText>
              <Switch
                value={paymentMethod === 'card'}
                onValueChange={(value) => value && setPaymentMethod('card')}
                thumbColor={Colors[colorScheme ?? 'light'].tint}
                trackColor={{ 
                  false: Colors[colorScheme ?? 'light'].border || '#ccc',
                  true: Colors[colorScheme ?? 'light'].success || '#4CAF50' 
                }}
              />
            </View>
            <View style={styles.paymentRow}>
              <ThemedText>Mobile</ThemedText>
              <Switch
                value={paymentMethod === 'mobile'}
                onValueChange={(value) => value && setPaymentMethod('mobile')}
                thumbColor={Colors[colorScheme ?? 'light'].tint}
                trackColor={{ 
                  false: Colors[colorScheme ?? 'light'].border || '#ccc',
                  true: Colors[colorScheme ?? 'light'].success || '#4CAF50' 
                }}
              />
            </View>
          </View>
        </ThemedView>
        
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Tip Amount</ThemedText>
          <View style={styles.tipCard}>
            <View style={styles.tipControl}>
              <ThemedText>$</ThemedText>
              <View style={styles.tipButtons}>
                <TouchableOpacity 
                  onPress={() => setTipAmount(Math.max(0, tipAmount - 1))}
                  style={[
                    styles.tipButton,
                    tipAmount > 0 && styles.tipButtonActive
                  ]}
                >
                  <ThemedText style={tipAmount > 0 ? styles.tipButtonTextActive : {}}>
                    -
                  </ThemedText>
                </TouchableOpacity>
                <ThemedText style={styles.tipValue}>{tipAmount}</ThemedText>
                <TouchableOpacity 
                  onPress={() => setTipAmount(tipAmount + 1)}
                  style={styles.tipButtonActive}
                >
                  <ThemedText style={styles.tipButtonTextActive}>+</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.suggestedTips}>
              <ThemedText style={styles.suggestedTipsTitle}>
                Suggested tips:
              </ThemedText>
              <View style={styles.suggestedTipsButtons}>
                <TouchableOpacity 
                  onPress={() => setTipAmount(Math.round(order.total * 0.15))}
                  style={styles.suggestedTipButton}
                >
                  <ThemedText style={styles.suggestedTipButtonText}>
                    15%
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setTipAmount(Math.round(order.total * 0.18))}
                  style={styles.suggestedTipButton}
                >
                  <ThemedText style={styles.suggestedTipButtonText}>
                    18%
                  </ThemedText>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setTipAmount(Math.round(order.total * 0.20))}
                  style={styles.suggestedTipButton}
                >
                  <ThemedText style={styles.suggestedTipButtonText}>
                    20%
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ThemedView>
        
        <ThemedView style={styles.totalCard}>
          <View style={styles.totalRow}>
            <ThemedText>Order Total:</ThemedText>
            <ThemedText>${order.total.toFixed(2)}</ThemedText>
          </View>
          {tipAmount > 0 && (
            <View style={styles.totalRow}>
              <ThemedText>Tip:</ThemedText>
              <ThemedText>${tipAmount.toFixed(2)}</ThemedText>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <ThemedText type="title">Total:</ThemedText>
            <ThemedText type="title">${calculateTotal().toFixed(2)}</ThemedText>
          </View>
        </ThemedView>
        
        <TouchableOpacity 
          onPress={handleProcessPayment}
          style={[
            styles.confirmButton,
            isProcessing && styles.confirmButtonDisabled
          ]}
        >
          <ThemedText style={styles.confirmButtonText}>
            {isProcessing ? 'Processing...' : 'Confirm Payment'}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  header: {
    padding: 16,
  },
  headerTitle: {
    textAlign: 'center',
  },
  headerTable: {
    marginTop: 4,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  successCard: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
  },
  successTitle: {
    marginTop: 16,
  },
  successSubtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  receiptCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  totalCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  actionButtons: {
    marginTop: 24,
  },
  printButton: {
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  printButtonText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  doneButton: {
    paddingVertical: 12,
    borderRadius: 8,
  },
  doneButtonText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  orderCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  paymentCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  tipCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  tipControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 4,
    overflow: 'hidden',
  },
  tipButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tipButtonActive: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tipButtonTextActive: {
    fontWeight: '600',
  },
  tipValue: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 40,
    textAlign: 'center',
  },
  suggestedTips: {
    marginTop: 12,
  },
  suggestedTipsTitle: {
    textAlign: 'center',
  },
  suggestedTipsButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  suggestedTipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  suggestedTipButtonText: {
    fontWeight: '600',
  },
  confirmButton: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    textAlign: 'center',
    fontWeight: '600',
  },
});
