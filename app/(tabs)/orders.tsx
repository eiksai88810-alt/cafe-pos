import { useEffect, useState, useCallback } from 'react';
import { FlatList, View, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Order } from '@/types';

export default function OrdersScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { activeOrders, setActiveOrders, user } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchActiveOrders = async () => {
      const mockOrders: Order[] = [
        {
          id: '1',
          tableId: '1',
          items: [
            { id: '1', menuItemId: '1', quantity: 2, name: 'Caesar Salad', price: 12.99 },
            { id: '2', menuItemId: '2', quantity: 1, name: 'Grilled Salmon', price: 24.99 }
          ],
          status: 'preparing',
          total: 50.97,
          createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
          updatedAt: new Date(Date.now() - 10 * 60000).toISOString()
        },
        {
          id: '2',
          tableId: '3',
          items: [
            { id: '3', menuItemId: '3', quantity: 1, name: 'Cheeseburger', price: 15.99 },
            { id: '4', menuItemId: '4', quantity: 2, name: 'French Fries', price: 8.99 }
          ],
          status: 'ready',
          total: 33.97,
          createdAt: new Date(Date.now() - 45 * 60000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 60000).toISOString()
        }
      ];
      setActiveOrders(mockOrders);
    };

    if (user) {
      fetchActiveOrders();
    }
  }, [user, setActiveOrders]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return Colors[colorScheme ?? 'light'].info || '#2196F3';
      case 'preparing': return Colors[colorScheme ?? 'light'].warning || '#FF9800';
      case 'ready': return Colors[colorScheme ?? 'light'].success || '#4CAF50';
      case 'completed': return Colors[colorScheme ?? 'light'].secondary || '#9E9E9E';
      case 'paid': return Colors[colorScheme ?? 'light'].success || '#4CAF50';
      default: return Colors[colorScheme ?? 'light'].border || '#ccc';
    }
  };

  const renderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      onPress={() => router.push(`/order/${item.id}`)}
      style={[
        styles.orderCard,
        { borderColor: getStatusColor(item.status) }
      ]}
    >
      <View style={styles.orderCardContent}>
        <View>
          <ThemedText type="title">
            Table {item.tableId}
          </ThemedText>
          <ThemedText numberOfLines={2}>
            {item.items.map((i, index) => 
              `${i.name} x${i.quantity}${index < item.items.length - 1 ? ', ' : ''}`
            ).join('')}
          </ThemedText>
          <ThemedText type="default" style={styles.itemCount}>
            {item.items.length} item{item.items.length !== 1 ? 's' : ''}
          </ThemedText>
        </View>
        <View style={styles.orderSummary}>
          <ThemedText type="defaultSemiBold" style={{ color: getStatusColor(item.status) }}>
            {item.status.toUpperCase()}
          </ThemedText>
          <ThemedText type="defaultSemiBold">
            ${item.total.toFixed(2)}
          </ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.centerText}>
          Please log in to access orders
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {activeOrders.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.loadingText}>
            Loading orders...
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={activeOrders}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>
              No active orders
            </ThemedText>
          }
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  orderCard: {
    margin: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  orderCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemCount: {
    marginTop: 4,
  },
  orderSummary: {
    alignItems: 'flex-end',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
  },
});
