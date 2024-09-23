import React, { useEffect, useState } from 'react';
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import axios from 'axios';
import Icon from 'react-native-vector-icons/FontAwesome';

const FIREBASE_URL = 'https://firestore.googleapis.com/v1/projects/qlnd-3382c/databases/(default)/documents/Users?key=AIzaSyD3FRcozvW8EFDcdIAAH_V-pRiT1hCtZ7M';

const App = () => {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(FIREBASE_URL);
      const userData = response.data.documents.map(doc => ({
        id: doc.name.split('/').pop(),
        name: doc.fields.name.stringValue,
        email: doc.fields.email.stringValue,
        age: doc.fields.age.integerValue,
      }));
      setUsers(userData);
    } catch (error) {
      console.error("Lỗi khi lấy dữ liệu: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !email || !age) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }

    if (editId) {
      await updateUser(editId);
    } else {
      await addUser();
    }
  };

  const addUser = async () => {
    setLoading(true);
    try {
      const response = await axios.post(FIREBASE_URL, {
        fields: {
          name: { stringValue: name },
          email: { stringValue: email },
          age: { integerValue: age }
        }
      });
      const newUser = {
        id: response.data.name.split('/').pop(),
        name,
        email,
        age,
      };
      setUsers(prevUsers => [...prevUsers, newUser]);
      Alert.alert('Thành công', 'Người dùng đã được thêm thành công.');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể thêm người dùng.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id) => {
    try {
      await axios.patch(`https://firestore.googleapis.com/v1/projects/qlnd-3382c/databases/(default)/documents/Users/${id}?key=AIzaSyD3FRcozvW8EFDcdIAAH_V-pRiT1hCtZ7M`, {
        fields: {
          name: { stringValue: name },
          email: { stringValue: email },
          age: { integerValue: age },
        },
      });

      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === id ? { ...user, name, email, age: Number(age) } : user
        )
      );

      Alert.alert('Thành công', 'Thông tin người dùng đã được cập nhật.');
      resetForm();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật người dùng.');
      console.error(error);
    }
  };

  const handleEdit = (user) => {
    setName(user.name);
    setEmail(user.email);
    setAge(user.age.toString());
    setEditId(user.id);
  };

  const handleDelete = async (id) => {
    Alert.alert("Xóa", "Bạn có chắc chắn muốn xóa không?", [
      { text: "Hủy", style: "cancel" },
      { 
        text: "Xóa", 
        onPress: async () => {
          setLoading(true);
          try {
            await axios.delete(`https://firestore.googleapis.com/v1/projects/qlnd-3382c/databases/(default)/documents/Users/${id}?key=AIzaSyD3FRcozvW8EFDcdIAAH_V-pRiT1hCtZ7M`);
            setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
            Alert.alert('Thành công', 'Người dùng đã được xóa.');
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa người dùng.');
            console.error(error);
          } finally {
            setLoading(false);
          }
        }
      }
    ]);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setAge('');
    setEditId(null);
    setFocusedInput(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản lý thông tin</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <>
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, focusedInput === 'name' ? styles.focused : styles.unfocused]}>
              <Icon name="user" size={20} color="#007BFF" />
              <TextInput
                style={styles.input}
                placeholder="Tên"
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedInput('name')}
              />
            </View>
            
            <View style={[styles.inputWrapper, focusedInput === 'email' ? styles.focused : styles.unfocused]}>
              <Icon name="envelope" size={20} color="#007BFF" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                onFocus={() => setFocusedInput('email')}
              />
            </View>
            
            <View style={[styles.inputWrapper, focusedInput === 'age' ? styles.focused : styles.unfocused]}>
              <Icon name="calendar" size={20} color="#007BFF" />
              <TextInput
                style={styles.input}
                placeholder="Tuổi"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                onFocus={() => setFocusedInput('age')}
              />
            </View>
          </View>

          <TouchableOpacity onPress={handleSubmit} style={styles.addButton}>
            <Icon name="plus" size={20} color="#0000FF" />
            <Text style={styles.buttonText}>{editId ? "Cập nhật" : "Thêm"}</Text>
          </TouchableOpacity>

          <Text style={styles.subtitle}>Danh sách người dùng</Text>
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.itemText}>{item.name} - {item.email} - {item.age}</Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editButton}>
                    <Text style={styles.buttonText}>Sửa</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                    <Text style={styles.buttonText}>Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#87CEEB',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#007BFF',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  input: {
    height: 50,
    flex: 1,
    marginLeft: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 5,
    marginVertical: 5,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  itemText: {
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  editButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 5,
    flex: 1,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  focused: {
    backgroundColor: '#CCCCCC', // Màu nền ô đang focus
  },
  unfocused: {
    backgroundColor: '#ffffff', // Màu nền ô không focus
  },
});

export default App;
