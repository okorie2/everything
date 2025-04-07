  const getPermissions = async () => {
    const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
    const mediaPermission =
      await ImagePicker.getMediaLibraryPermissionsAsync();
 const status = {
  camera: cameraPermission.status === "granted",
  media: mediaPermission.status === "granted",
}
    return status
  };

  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    const status = {
      camera: cameraPermission.status === "granted",
      media: mediaPermission.status === "granted",
    };
    return status;
  };

  // Function to open device settings
const openSettings = async () => {
    // For iOS and Android
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };