import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

const CHOICES = [
  { name: 'rock', image: require('../../../assets/rock.png') },
  { name: 'paper', image: require('../../../assets/paper.png') },
  { name: 'scissors', image: require('../../../assets/scissors.png') }
];

const RockPaperScissorsScreen = () => {
  const [playerChoice, setPlayerChoice] = useState(null);
  const [computerChoice, setComputerChoice] = useState(null);
  const [result, setResult] = useState('');
  const [score, setScore] = useState({ player: 0, computer: 0 });

  const determineWinner = (player, computer) => {
    if (player === computer) return 'Tie';
    
    const winConditions = {
      rock: 'scissors',
      paper: 'rock',
      scissors: 'paper'
    };

    return winConditions[player] === computer ? 'Player Wins' : 'Computer Wins';
  };

  const playGame = (playerSelection) => {
    // Player makes a choice
    setPlayerChoice(playerSelection);

    // Computer randomly selects
    const computerSelection = CHOICES[Math.floor(Math.random() * 3)].name;
    setComputerChoice(computerSelection);

    // Determine winner
    const gameResult = determineWinner(playerSelection, computerSelection);
    setResult(gameResult);

    // Update score
    if (gameResult === 'Player Wins') {
      setScore(prev => ({ ...prev, player: prev.player + 1 }));
    } else if (gameResult === 'Computer Wins') {
      setScore(prev => ({ ...prev, computer: prev.computer + 1 }));
    }
  };

  const resetGame = () => {
    setPlayerChoice(null);
    setComputerChoice(null);
    setResult('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rock Paper Scissors</Text>
      
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Player: {score.player}</Text>
        <Text style={styles.scoreText}>Computer: {score.computer}</Text>
      </View>

      <View style={styles.choicesContainer}>
        {CHOICES.map((choice) => (
          <TouchableOpacity 
            key={choice.name}
            style={styles.choiceButton}
            onPress={() => playGame(choice.name)}
          >
            <Image 
              source={choice.image} 
              style={styles.choiceImage}
              resizeMode="contain"
            />
            <Text style={styles.choiceName}>{choice.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {playerChoice && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>Your Choice: {playerChoice}</Text>
          <Text style={styles.resultText}>Computer's Choice: {computerChoice}</Text>
          <Text style={styles.resultText}>{result}</Text>
          <TouchableOpacity style={styles.resetButton} onPress={resetGame}>
            <Text style={styles.resetButtonText}>Play Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  choicesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  choiceButton: {
    alignItems: 'center',
    padding: 10,
  },
  choiceImage: {
    width: 80,
    height: 80,
  },
  choiceName: {
    marginTop: 10,
    textTransform: 'capitalize',
  },
  resultContainer: {
    alignItems: 'center',
    marginTop: 20,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  resetButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default RockPaperScissorsScreen;