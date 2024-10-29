import CustomHeaderTitle from "@/components/CustomHeaderTitle";
import { Stack } from "expo-router";
//import { useColorScheme } from "react-native";
import { Appbar, Icon, useTheme } from "react-native-paper";

export default function RootLayout() {
  const { colors } = useTheme(); 
  return (
    <Stack>
      <Stack.Screen 
        name="index"
        options={{ 
          title: 'UPick',
          headerTitle: (props) => <CustomHeaderTitle title='UPick'/> ,
          headerTintColor: colors.inversePrimary,
          headerStyle: { backgroundColor: colors.primary} 
          }}
      >
          
          </Stack.Screen>
    </Stack>
  );
}
