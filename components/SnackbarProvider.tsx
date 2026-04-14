import React, { createContext, useCallback, useContext, useState } from 'react';
import { Snackbar } from 'react-native-paper';

interface SnackbarContextType {
    showSnackbar: (message: string) => void;
}

const SnackbarContext = createContext<SnackbarContextType>({ showSnackbar: () => {} });

export const useSnackbar = () => useContext(SnackbarContext);

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');

    const showSnackbar = useCallback((msg: string) => {
        setMessage(msg);
        setVisible(true);
    }, []);

    return (
        <SnackbarContext.Provider value={{ showSnackbar }}>
            {children}
            <Snackbar
                visible={visible}
                onDismiss={() => setVisible(false)}
                duration={2500}
                action={{ label: 'OK', onPress: () => setVisible(false) }}
            >
                {message}
            </Snackbar>
        </SnackbarContext.Provider>
    );
};
