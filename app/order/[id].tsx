import { useEffect, useState } from 'react';
import { View, TouchableOpacity, FlatList, ActivityIndicator, Modal, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Order, OrderItem } from '@/types';

export default function OrderDetailScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams() as { orderId: string };
  const colorScheme = useColorScheme();
  const { activeOrders, setActiveOrders, user } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);

  useEffect(() => {
    const loadOrder = () => {
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
            status: 'preparing',
            total: 50.97,
            createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
            updatedAt: new Date(Date.now() - 10 * 60000).toISOString()
          };
          setOrder(mockOrder);
        }, 500);
      }
    };

    loadOrder();
  }, [orderId, activeOrders]);

  const handleRemoveItem = (itemId: string) => {
    if (!order) return;
    
    const updatedOrder = {
      ...order,
      items: order.items.filter(item => item.id !== itemId),
      total: order.items
        .filter(item => item.id !== itemId)
        .reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };
    
    setOrder(updatedOrder);
    setActiveOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
  };

  const handleOpenPaymentModal = () => {
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setTipAmount(0);
  };

  const handleCompletePayment = () => {
    if (!order) return;
    
    const updatedOrder = { ...order, status: 'paid' };
    setOrder(updatedOrder);
    setActiveOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    handleClosePaymentModal();
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

  const formattedTotal = (order.total + tipAmount).toFixed(2);
  const timeAgo = new Date(order.updatedAt).toLocaleTimeString();

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Order Details</ThemedText>
        <View style={styles.timeContainer}>
          <IconSymbol name="clock.fill" size={16} color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.timeText}>{timeAgo}</ThemedText>
        </View>
      </View>

      <ThemedView style={styles.infoCard}>
        <ThemedText type="subtitle">Table {order.tableId}</ThemedText>
        <ThemedText style={styles.statusText}>
          Status: 
          <ThemedText type="defaultSemiBold" style={[
            styles.statusBadge,
            { color: getStatusColor(order.status, colorScheme) }
          ]}>
            {order.status}
          </ThemedText>
        </ThemedText>
      </ThemedView>

      {!isEditing ? (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Order Items</ThemedText>
          <FlatList
            data={order.items}
            renderItem={({ item }) => (
              <ThemedView style={styles.itemRow}>
                <View>
                  <ThemedText>
                    {item.name} x{item.quantity}
                  </ThemedText>
                  <ThemedText type="default">
                    ${(item.price * item.quantity).toFixed(2)}
                  </ThemedText>
                </View>
                <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                  <IconSymbol name="trash.fill" size={20} color={Colors[colorScheme ?? 'light'].error || '#F44336'} />
                </TouchableOpacity>
              </ThemedView>
            )}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <ThemedText style={styles.emptyText}>
                No items in order
              </ThemedText>
            }
          />
        </ThemedView>
      ) : (
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Edit Order Items</ThemedText>
          <TouchableOpacity style={styles.addButton}>
            <IconSymbol name="plus" size={20} color={Colors[colorScheme ?? 'light'].background || '#fff'} />
            <ThemedText style={styles.addButtonText}>
              Add Item
            </ThemedText>
          </TouchableOpacity>
          
          <FlatList
            data={order.items}
            renderItem={({ item }) => (
              <ThemedView style={styles.editItemRow}>
                <View style={styles.editItemInfo}>
                  <ThemedText>
                    {item.name}
                  </ThemedText>
                  <ThemedText style={styles.quantityText}>
                    x{item.quantity}
                  </ThemedText>
                </View>
                <View style={styles.editItemActions}>
                  <ThemedText>
                    ${item.price.toFixed(2)}
                  </ThemedText>
                  <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
                    <IconSymbol name="trash.fill" size={16} color={Colors[colorScheme ?? 'light'].error || '#F44336'} />
                  </TouchableOpacity>
                </View>
              </ThemedView>
            )}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <ThemedText style={styles.emptyText}>
                No items in order
              </ThemedText>
            }
          />
        </ThemedView>
      )}

      <ThemedView style={styles.summaryCard}>
        <ThemedText type="subtitle">Order Summary</ThemedText>
        <View style={styles.summaryRow}>
          <ThemedText>Subtotal:</ThemedText>
          <ThemedText>${order.total.toFixed(2)}</ThemedText>
        </View>
        <View style={styles.summaryRow}>
          <ThemedText>Tip:</ThemedText>
          <ThemedText>${tipAmount.toFixed(2)}</ThemedText>
        </View>
        <View style={styles.totalRow}>
          <ThemedText type="title">Total:</ThemedText>
          <ThemedText type="title">${formattedTotal}</ThemedText>
        </View>
      </ThemedView>

      {!isEditing && (
        <View style={styles.tipSection}>
          <ThemedText type="subtitle">Tip Amount</ThemedText>
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
        </View>
      )}

      <View style={styles.actionButtons}>
        {!isEditing ? (
          <>
            <TouchableOpacity 
              onPress={() => setIsEditing(true)}
              style={styles.editButton}
            >
              <ThemedText style={styles.editButtonText}>
                Edit Order
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleOpenPaymentModal}
              style={[
                styles.paymentButton,
                order.status === 'ready' && styles.paymentButtonReady
              ]}
            >
              <ThemedText style={[
                styles.paymentButtonText,
                order.status === 'ready' && styles.paymentButtonTextReady
              ]}>
                Request Payment
              </ThemedText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity 
              onPress={() => setIsEditing(false)}
              style={styles.cancelButton}
            >
              <ThemedText style={styles.cancelButtonText}>
                Cancel
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setIsEditing(false)}
              style={styles.saveButton}
            >
              <ThemedText style={styles.saveButtonText}>
                Save
              </ThemedText>
            </TouchableOpacity>
          </>
        )}
      </View>

      <Modal
        visible={isPaymentModalOpen}
        transparent={true}
        animationType="fade"
      >
        <ThemedView style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <ThemedText type="title" style={styles.modalTitle}>
              Request Payment
            </ThemedText>
            
            <ThemedView style={styles.modalSection}>
              <ThemedText>Order Total:</ThemedText>
              <ThemedText type="title" style={styles.modalTotal}>
                ${order.total.toFixed(2)}
              </ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.modalSection}>
              <ThemedText>Tip Amount:</ThemedText>
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
            </ThemedView>
            
            <ThemedView style={styles.modalTotalSection}>
              <ThemedText>Total:</ThemedText>
              <ThemedText type="title" style={styles.modalTotal}>
                ${formattedTotal}
              </ThemedText>
            </ThemedView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                onPress={handleClosePaymentModal}
                style={styles.modalCancelButton}
              >
                <ThemedText style={styles.modalCancelButtonText}>
                  Cancel
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleCompletePayment}
                style={styles.modalConfirmButton}
              >
                <ThemedText style={styles.modalConfirmButtonText}>
                  Complete Payment
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ThemedView>
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

function getStatusColor(status: Order['status'], colorScheme: string | null) {
  switch (status) {
    case 'pending': return Colors[colorScheme ?? 'light'].info || '#2196F3';
    case 'preparing': return Colors[colorScheme ?? 'light'].warning || '#FF9800';
    case 'ready': return Colors[colorScheme ?? 'light'].success || '#4CAF50';
    case 'completed': return Colors[colorScheme ?? 'light'].secondary || '#9E9E9E';
    case 'paid': return Colors[colorScheme ?? 'light'].success || '#4CAF50';
    default: return Colors[colorScheme ?? 'light'].border || '#ccc';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {},
  infoCard: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
  },
  statusText: {
    marginTop: 4,
  },
  statusBadge: {
    textTransform: 'capitalize',
    marginLeft: 4,
  },
  section: {
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  editItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  editItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityText: {
    marginLeft: 8,
  },
  editItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  addButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  addButtonText: {
    marginLeft: 8,
    fontWeight: '600',
  },
  summaryCard: {
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  tipSection: {
    marginBottom: 16,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  editButtonText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  paymentButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  paymentButtonReady: {
    borderWidth: 0,
  },
  paymentButtonText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  paymentButtonTextReady: {
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  saveButtonText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalTotal: {
    marginTop: 4,
    textAlign: 'right',
  },
  modalTotalSection: {
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  modalCancelButtonText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalConfirmButtonText: {
    textAlign: 'center',
    fontWeight: '600',
  },
});
