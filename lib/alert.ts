import { Alert, AlertButton } from "react-native";

interface AlertProps {
    title: string;
    message: string;
    buttons?: AlertButton[];

}

export const createAlert = ({ title, message, buttons }: AlertProps) =>
    Alert.alert(title, message, buttons || [{ text: "OK" }]);