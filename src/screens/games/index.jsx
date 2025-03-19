import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";

const GamesScreen = ({ navigation }) => {
  const games = [
    { 
      id: '1', 
      title: 'Tic Tac Toe', 
      route: 'TicTacToe',
      icon: 'grid'
    },
    { 
      id: '2', 
      title: 'Rock Paper Scissors', 
      route: 'RockPaperScissors',
      icon: 'hand-peace'
    },
    { 
      id: '3', 
      title: 'Dice Rolling', 
      route: 'DiceRolling',
      icon: 'dice-multiple'
    },
  ];

  const renderGameItem = ({ item }) => (
    <TouchableOpacity
      style={styles.gameItem}
      onPress={() => navigation.navigate(item.route)}
    >
      <View style={styles.gameItemContent}>
        <MaterialCommunityIcons name={item.icon} size={24} color="#4a69bd" />
        <Text style={styles.gameTitle}>{item.title}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#4a69bd" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Games Collection</Text>
      </View>
      
      <FlatList
        data={games}
        renderItem={renderGameItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#4a69bd',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  listContainer: {
    padding: 16,
  },
  gameItem: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  gameItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 12,
  },
});

export default GamesScreen;