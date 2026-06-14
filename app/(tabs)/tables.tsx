import { useEffect, useState } from 'react';
import { FlatList, View, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Table } from '@/types';

export default function TablesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { tables, setTables, user } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchTables = async () => {
      const mockTables: Table[] = [
        { id: '1', number: 1, status: 'available' },
        { id: '2', number: 2, status: 'available' },
        { id: '3', number: 3, status: 'occupied' },
        { id: '4', number: 4, status: 'available' },
        { id: '5', number: 5, status: 'needs_payment' },
        { id: '6', number: 6, status: 'available' },
      ];
      setTables(mockTables);
    };

    if (user) {
      fetchTables();
    }
  }, [user, setTables]);

  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available': return Colors[colorScheme ?? 'light'].success || '#4CAF50';
      case 'occupied': return Colors[colorScheme ?? 'light'].warning || '#FF9800';
      case 'needs_payment': return Colors[colorScheme ?? 'light'].error || '#F44336';
      default: return Colors[colorScheme ?? 'light'].border || '#ccc';
    }
  };

  const handleTablePress = (table: Table) => {
    if (table.status === 'available') {
      router.push(`/order/new?tableId=${table.id}`);
    } else if (table.currentOrderId) {
      router.push(`/order/${table.currentOrderId}`);
    }
  };

  const renderItem = ({ item }: { item: Table }) => (
    <TouchableOpacity
      onPress={() => handleTablePress(item)}
      style={[
        styles.tableCard,
        { borderColor: getStatusColor(item.status) }
      ]}
    >
      <View style={styles.tableCardContent}>
        <IconSymbol 
          name={item.status === 'available' ? 'square.fill' : 
                 item.status === 'occupied' ? 'person.fill' : 
                 'creditcard.fill'} 
          size={40} 
          color={getStatusColor(item.status)} 
        />
        <ThemedText type="title" style={styles.tableNumber}>
          Table {item.number}
        </ThemedText>
        <ThemedText type="default" style={styles.tableStatus}>
          {item.status}
        </ThemedText>
        {item.status === 'needs_payment' && (
          <ThemedText type="defaultSemiBold" style={styles.paymentText}>
            Ready for payment
          </ThemedText>
        )}
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.centerText}>
          Please log in to access tables
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {tables.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.loadingText}>
            Loading tables...
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={tables}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                setTimeout(() => setRefreshing(false), 1000);
              }}
            />
          }
          ListEmptyComponent={
            <ThemedText style={styles.emptyText}>
              No tables found
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
  tableCard: {
    flex: 1,
    margin: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCardContent: {
    alignItems: 'center',
  },
  tableNumber: {
    marginTop: 8,
  },
  tableStatus: {
    textTransform: 'capitalize',
  },
  paymentText: {
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
  },
});
