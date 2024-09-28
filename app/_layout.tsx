import { Stack } from "expo-router";
//import { useColorScheme } from "react-native";
import { useTheme } from "react-native-paper";

export default function RootLayout() {
  const { colors } = useTheme(); 
  return (
    <Stack>
      <Stack.Screen 
        name="index"
        options={{ 
          title: 'UPick',
          headerTintColor: colors.inversePrimary,
          headerStyle: { backgroundColor: colors.primary} 
          }}/>
    </Stack>
  );
}
