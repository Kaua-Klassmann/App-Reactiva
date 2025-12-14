import { useEffect, useRef, useState } from 'react';
import { Button, StatusBar, Text, BackHandler, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from 'react-native-webview';
import Orientation from 'react-native-orientation-locker';

const INJECT_SCRIPT = `
  (function() {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    
    // Remove meta viewport existente
    const existingMeta = document.querySelector('meta[name="viewport"]');
    if (existingMeta) {
      existingMeta.parentNode.removeChild(existingMeta);
    }
    
    document.getElementsByTagName('head')[0].appendChild(meta);

    const style = document.createElement('style');
    style.innerHTML = \`
      * {
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        touch-action: pan-x pan-y;
      }
      
      body {
        -webkit-text-size-adjust: 100%;
      }
    \`;
    document.head.appendChild(style);

    // Previne zoom com gestos
    document.addEventListener('gesturestart', function(e) {
      e.preventDefault();
    });
    
    document.addEventListener('gesturechange', function(e) {
      e.preventDefault();
    });
    
    document.addEventListener('gestureend', function(e) {
      e.preventDefault();
    });
  })();
  true;
`;

function AppContent() {
  const webViewRef = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    Orientation.lockToPortrait();

    const backAction = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [canGoBack]);

  if (hasError) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Sem conexão 😕</Text>
        <Button title="Tentar novamente" onPress={() => setHasError(false)} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <WebView
        ref={webViewRef}
        source={{ uri: 'https://reactiva.com.br/' }}
        onNavigationStateChange={nav => setCanGoBack(nav.canGoBack)}
        javaScriptEnabled
        injectedJavaScript={INJECT_SCRIPT}
        injectedJavaScriptBeforeContentLoaded={INJECT_SCRIPT}
        onError={() => setHasError(true)}
        {...Platform.OS === 'android' && {
          scalesPageToFit: false,
          setBuiltInZoomControls: false,
        }}
        {...Platform.OS === 'ios' && {
          allowsLinkPreview: false,
          scrollEnabled: true,
          bounces: false,
        }}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}