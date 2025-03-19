import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Note Item Component - receives note data and delete handler as props
const NoteItem = ({ note, onDelete }) => {
  return (
    <View style={styles.noteItem}>
      <View style={styles.noteContent}>
        <Text style={styles.noteTitle}>{note.title}</Text>
        <Text style={styles.noteBody}>{note.body}</Text>
        <Text style={styles.noteDate}>{note.date}</Text>
      </View>
      <TouchableOpacity onPress={() => onDelete(note.id)} style={styles.deleteButton}>
        <MaterialCommunityIcons name="delete" size={24} color="#ff6b6b" />
      </TouchableOpacity>
    </View>
  );
};

// Add Note Form Component - receives add note handler as prop
const AddNoteForm = ({ onAddNote }) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const handleAddNote = () => {
    if (title.trim() === '' || body.trim() === '') {
      return; // Don't add empty notes
    }

    // Create new note object
    const newNote = {
      id: Date.now().toString(), // Simple unique ID
      title: title,
      body: body,
      date: new Date().toLocaleString()
    };

    onAddNote(newNote);
    
    // Clear form
    setTitle('');
    setBody('');
  };

  return (
    <View style={styles.addNoteForm}>
      <Text style={styles.formTitle}>Add New Note</Text>
      <TextInput
        style={styles.input}
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
      />
      <TextInput
        style={[styles.input, styles.bodyInput]}
        placeholder="Note content"
        value={body}
        onChangeText={setBody}
        multiline
      />
      <TouchableOpacity style={styles.addButton} onPress={handleAddNote}>
        <Text style={styles.addButtonText}>Add Note</Text>
      </TouchableOpacity>
    </View>
  );
};

// Main Notes Screen Component
const NotesScreen = ({ notes, onAddNote, onDeleteNote }) => {
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Notes</Text>
      </View>

      <FlatList
        data={notes}
        renderItem={({ item }) => (
          <NoteItem note={item} onDelete={onDeleteNote} />
        )}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.notesList}
        ListEmptyComponent={
          <Text style={styles.emptyMessage}>No notes yet. Add your first note!</Text>
        }
      />

      <AddNoteForm onAddNote={onAddNote} />
    </KeyboardAvoidingView>
  );
};

// Parent component that manages state and passes props
const NotesScreenContainer = () => {
  const [notes, setNotes] = useState([]);

  const handleAddNote = (newNote) => {
    setNotes(prevNotes => [newNote, ...prevNotes]);
  };

  const handleDeleteNote = (noteId) => {
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
  };

  return (
    <NotesScreen
      notes={notes}
      onAddNote={handleAddNote}
      onDeleteNote={handleDeleteNote}
    />
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
  notesList: {
    padding: 16,
  },
  noteItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  noteContent: {
    flex: 1,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2c3e50',
  },
  noteBody: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
  },
  noteDate: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  deleteButton: {
    justifyContent: 'center',
    paddingLeft: 10,
  },
  addNoteForm: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c3e50',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  bodyInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: '#4a69bd',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyMessage: {
    textAlign: 'center',
    fontSize: 16,
    color: '#95a5a6',
    marginTop: 40,
    marginBottom: 40,
  },
});

export default NotesScreenContainer;