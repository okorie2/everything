import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeLocalData = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value) );
    console.log('Data saved!');
  } catch (e) {
    console.error('Failed to save data', e);
  }
};

export const getLocalData = async (key) => {
  try {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      console.log('Data retrieved:', value);
      return value ;
    }
  } catch (e) {
    console.error('Failed to fetch data', e);
    return null;
  }
};

export const deleteData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`Deleted ${key} successfully`);
  } catch (e) {
    console.error(`Failed to delete ${key}`, e);
  }
};
