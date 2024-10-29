import { View, Text } from 'react-native';
import { Appbar, Icon } from 'react-native-paper';

export default function CustomNavigationBar(props: {title : string}) {
  return (
    <View style={{flexDirection: "row"}}>
      <Icon source="calendar" size={20}/>
      <Text> {props.title}</Text>
    </View>
  );
}