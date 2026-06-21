import { useState, useEffect } from 'react';
import { Alert, View, TouchableOpacity, FlatList, ActivityIndicator, TextInput, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStore } from '@/store/useStore';
import { MenuItem, OrderItem, Order } from '@/types';
import { PrinterStatusButton } from '@/components/printer-status-button';
import { usePrinterStore } from '@/store/usePrinterStore';

const MOCK_MENU_ITEMS: MenuItem[] = [
  { id: '1', name: 'Caesar Salad', description: 'Fresh romaine with parmesan and croutons', price: 12.99, category: 'Starters', isAvailable: true },
  { id: '2', name: 'Grilled Salmon', description: 'Atlantic salmon with lemon herb sauce', price: 24.99, category: 'Main Courses', isAvailable: true },
  { id: '3', name: 'Cheeseburger', description: 'Classic beef burger with cheddar', price: 15.99, category: 'Main Courses', isAvailable: true },
  { id: '4', name: 'French Fries', description: 'Crispy golden fries', price: 8.99, category: 'Sides', isAvailable: true },
  { id: '5', name: 'Chocolate Cake', description: 'Rich chocolate layer cake', price: 7.99, category: 'Desserts', isAvailable: true },
  { id: '6', name: 'Iced Tea', description: 'Freshly brewed iced tea', price: 3.99, category: 'Beverages', isAvailable: true },
];

export default function NewOrderScreen() {
  const router = useRouter();
  const { tableId } = useLocalSearchParams() as { tableId?: string };
  const { user, addOrder } = useStore();
  const { printOrder, skipQueuedJob } = usePrinterStore();
  const colorScheme = useColorScheme();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMenuItems = async () => {
      setLoading(true);
      setTimeout(() => {
        setMenuItems(MOCK_MENU_ITEMS);
        setLoading(false);
      }, 500);
    };

    fetchMenuItems();
  }, []);

  const filteredMenuItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    item.isAvailable
  );

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleAddItem = (menuItem: MenuItem) => {
    setSelectedItems(prev => {
      const existingItemIndex = prev.findIndex(item => item.menuItemId === menuItem.id);
      if (existingItemIndex >= 0) {
        const updatedItems = [...prev];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        return updatedItems;
      } else {
        return [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          menuItemId: menuItem.id,
          quantity: 1,
          specialInstructions: '',
          name: menuItem.name,
          price: menuItem.price
        }];
      }
    });
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleDecreaseQuantity = (itemId: string) => {
    setSelectedItems(prev => {
      const existingItemIndex = prev.findIndex(item => item.id === itemId);
      if (existingItemIndex >= 0) {
        const updatedItems = [...prev];
        if (updatedItems[existingItemIndex].quantity > 1) {
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity - 1
          };
          return updatedItems;
        } else {
          return prev.filter(item => item.id !== itemId);
        }
      }
      return prev;
    });
  };

  const handleIncreaseQuantity = (itemId: string) => {
    setSelectedItems(prev => {
      const existingItemIndex = prev.findIndex(item => item.id === itemId);
      if (existingItemIndex >= 0) {
        const updatedItems = [...prev];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + 1
        };
        return updatedItems;
      }
      return prev;
    });
  };

  const handlePlaceOrder = async () => {
    if (!selectedItems.length || !tableId || !user) return;
    
    try {
      setLoading(true);
      
      const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9),
        tableId: tableId,
        items: selectedItems,
        status: 'pending',
        total: calculateTotal(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      addOrder(newOrder);

      const printResult = await printOrder(newOrder, user.name);
      if (printResult.status === 'queued') {
        Alert.alert('Printer not connected', `${printResult.message}\n\nKitchen ticket has been queued.`, [
          {
            text: 'Skip Printing',
            style: 'destructive',
            onPress: () => skipQueuedJob(printResult.jobId),
          },
          {
            text: 'Open Printer Setup',
            onPress: () => router.push('/printer'),
          },
          { text: 'Keep Queued' },
        ]);
      }

      router.replace(`/order/${newOrder.id}`);
    } catch (error) {
      console.error('Failed to place order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <ThemedText style={styles.loadingText}>Loading menu...</ThemedText>
      </ThemedView>
    );
  }

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.centerText}>Please log in to create orders</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <View>
          <ThemedText type="title" style={styles.headerTitle}>
            New Order
          </ThemedText>
          {tableId && (
            <ThemedText style={styles.headerTable}>
              Table #{tableId}
            </ThemedText>
          )}
        </View>
        <PrinterStatusButton />
      </ThemedView>
      
      <ThemedView style={styles.content}>
        <ThemedView style={styles.searchSection}>
          <ThemedText type="subtitle">Search Menu</ThemedText>
          <ThemedView style={styles.searchInput}>
            <IconSymbol name="search" size={20} color={Colors[colorScheme ?? 'light'].tint} />
            <TextInput
              placeholder="Search menu items..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={styles.searchTextInput}
              placeholderTextColor={Colors[colorScheme ?? 'light'].border || '#ccc'}
            />
          </ThemedView>
        </ThemedView>
        
        <ThemedView style={styles.categoriesSection}>
          <ThemedText type="subtitle">Menu Categories</ThemedText>
          <View style={styles.categoriesList}>
            {[...new Set(menuItems.map(item => item.category))].map(category => (
              <TouchableOpacity
                key={category}
                style={styles.categoryButton}
              >
                <ThemedText style={styles.categoryButtonText}>
                  {category}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>
        
        <ThemedView style={styles.menuSection}>
          <ThemedText type="subtitle">Available Items</ThemedText>
          {filteredMenuItems.length === 0 ? (
            <ThemedText style={styles.emptyText}>
              No items found
            </ThemedText>
          ) : (
            <FlatList
              data={filteredMenuItems}
              renderItem={({ item }) => (
                <ThemedView style={styles.menuItem}>
                  <View style={styles.menuItemInfo}>
                    <IconSymbol 
                      name={item.isAvailable ? 'circle.fill' : 'circle'} 
                      size={14} 
                      color={item.isAvailable ? Colors[colorScheme ?? 'light'].success || '#4CAF50' : Colors[colorScheme ?? 'light'].error || '#F44336'} 
                    />
                    <View>
                      <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
                      <ThemedText style={styles.menuItemPrice}>
                        ${item.price.toFixed(2)}
                      </ThemedText>
                      <ThemedText numberOfLines={1}>
                        {item.description}
                      </ThemedText>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={() => handleAddItem(item)}
                    style={styles.addButton}
                  >
                    <ThemedText style={styles.addButtonText}>
                      Add
                    </ThemedText>
                  </TouchableOpacity>
                </ThemedView>
              )}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <ThemedText style={styles.emptyText}>
                  No items to display
                </ThemedText>
              }
            />
          )}
        </ThemedView>
        
        {selectedItems.length > 0 && (
          <ThemedView style={styles.orderSummary}>
            <ThemedText type="subtitle">Your Order ({selectedItems.reduce((sum, item) => sum + item.quantity, 0)} items)</ThemedText>
            <FlatList
              data={selectedItems}
              renderItem={({ item }) => (
                <ThemedView style={styles.orderItem}>
                  <View style={styles.orderItemInfo}>
                    <ThemedText>
                      {item.name} x{item.quantity}
                    </ThemedText>
                    <ThemedText style={styles.orderItemPrice}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </ThemedText>
                  </View>
                  <View style={styles.orderItemActions}>
                    <TouchableOpacity 
                      onPress={() => handleDecreaseQuantity(item.id)}
                      style={styles.quantityButton}
                    >
                      <IconSymbol name="minus" size={16} color={Colors[colorScheme ?? 'light'].tint} />
                    </TouchableOpacity>
                    <ThemedText style={styles.quantityText}>{item.quantity}</ThemedText>
                    <TouchableOpacity 
                      onPress={() => handleIncreaseQuantity(item.id)}
                      style={styles.quantityButton}
                    >
                      <IconSymbol name="plus" size={16} color={Colors[colorScheme ?? 'light'].tint} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => handleRemoveItem(item.id)}
                      style={styles.removeButton}
                    >
                      <IconSymbol name="trash.fill" size={16} color={Colors[colorScheme ?? 'light'].error || '#F44336'} />
                    </TouchableOpacity>
                  </View>
                </ThemedView>
              )}
              keyExtractor={(item) => item.id}
            />
            
            <ThemedView style={styles.orderTotal}>
              <View>
                <ThemedText>Total:</ThemedText>
                <ThemedText type="title" style={styles.totalAmount}>
                  ${calculateTotal().toFixed(2)}
                </ThemedText>
              </View>
              <TouchableOpacity 
                onPress={handlePlaceOrder}
                style={[
                  styles.placeOrderButton,
                  { backgroundColor: Colors[colorScheme ?? 'light'].tint },
                  selectedItems.length === 0 && styles.placeOrderButtonDisabled
                ]}
              >
                <ThemedText style={[styles.placeOrderButtonText, { color: Colors[colorScheme ?? 'light'].background }]}>
                  Place Order
                </ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        )}
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
  centerText: {
    textAlign: 'center',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitle: {
    textAlign: 'left',
  },
  headerTable: {
    marginTop: 4,
    textAlign: 'left',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchSection: {
    marginBottom: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    paddingHorizontal: 12,
  },
  searchTextInput: {
    flex: 1,
    paddingVertical: 12,
  },
  categoriesSection: {
    marginBottom: 16,
  },
  categoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 20,
  },
  categoryButtonText: {},
  menuSection: {
    marginBottom: 24,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  menuItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemPrice: {},
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addButtonText: {
    fontWeight: '600',
  },
  orderSummary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    padding: 16,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  orderItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderItemPrice: {},
  orderItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 4,
  },
  quantityText: {
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 4,
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  totalAmount: {
    marginLeft: 4,
  },
  placeOrderButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  placeOrderButtonDisabled: {
    opacity: 0.5,
  },
  placeOrderButtonText: {
    fontWeight: '600',
  },
});
