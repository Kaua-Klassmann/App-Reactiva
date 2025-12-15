import { useEffect, useRef, useState } from 'react';
import { Button, StatusBar, Text, BackHandler, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from 'react-native-webview';
import Orientation from 'react-native-orientation-locker';

const INJECT_SCRIPT = `
  (function() {
    function setViewport() {
      // Remove todas as metas viewport existentes
      const metas = document.querySelectorAll('meta[name="viewport"]');
      metas.forEach(meta => meta.remove());
      
      // Adiciona a nova meta viewport
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no';
      document.head.insertBefore(meta, document.head.firstChild);
    }
    
    // Executa imediatamente
    setViewport();
    
    // Observa mudanças no head para impedir alterações na viewport
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.tagName === 'META' && node.getAttribute('name') === 'viewport') {
              const content = node.getAttribute('content');
              if (!content.includes('user-scalable=no') || !content.includes('maximum-scale=1')) {
                setViewport();
              }
            }
          });
        } else if (mutation.type === 'attributes' && mutation.target.getAttribute('name') === 'viewport') {
          setViewport();
        }
      });
    });
    
    observer.observe(document.head, {
      childList: true,
      attributes: true,
      subtree: true
    });

    // Adiciona CSS para prevenir zoom
    const style = document.createElement('style');
    style.innerHTML = \`
      * {
        -webkit-user-select: none;
        -webkit-touch-callout: none;
        touch-action: pan-x pan-y !important;
      }
      
      body {
        -webkit-text-size-adjust: 100% !important;
        touch-action: pan-x pan-y !important;
      }
      
      html {
        touch-action: pan-x pan-y !important;
      }
    \`;
    document.head.appendChild(style);

    // Previne gestos de zoom
    let lastTouchEnd = 0;
    
    document.addEventListener('touchstart', function(e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
    
    document.addEventListener('touchmove', function(e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
    
    document.addEventListener('touchend', function(e) {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    }, { passive: false });
    
    // Previne eventos de gesture do iOS
    document.addEventListener('gesturestart', function(e) {
      e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('gesturechange', function(e) {
      e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('gestureend', function(e) {
      e.preventDefault();
    }, { passive: false });
    
    // Previne double-tap zoom
    let lastTap = 0;
    document.addEventListener('touchend', function(e) {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 300 && tapLength > 0) {
        e.preventDefault();
      }
      lastTap = currentTime;
    }, { passive: false });
    
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
        injectedJavaScriptBeforeContentLoaded={INJECT_SCRIPT}
        injectedJavaScript={INJECT_SCRIPT}
        onError={() => setHasError(true)}
        onLoadEnd={() => {
          webViewRef.current?.injectJavaScript(INJECT_SCRIPT);
        }}
        {...(Platform.OS === 'android' && {
          scalesPageToFit: false,
          setBuiltInZoomControls: false,
        })}
        {...(Platform.OS === 'ios' && {
          allowsLinkPreview: false,
          scrollEnabled: true,
          bounces: false,
          decelerationRate: 'normal',
        })}
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