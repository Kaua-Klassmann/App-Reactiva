import { useEffect, useState } from 'react';
import { Button, StatusBar, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from 'react-native-webview';
import Orientation from 'react-native-orientation-locker';

function AppContent() {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    Orientation.lockToPortrait()
  }, []);

  if (hasError) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, marginBottom: 12 }}>Sem conexão com a internet 😕</Text>
        <Button title="Tentar novamente" onPress={() => setHasError(false)} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <WebView
        source={{ uri: 'https://reactiva.com.br/' }}
        startInLoadingState
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        cacheEnabled
        scalesPageToFit
        onError={() => setHasError(true)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent/>
    </SafeAreaProvider>
  )
}