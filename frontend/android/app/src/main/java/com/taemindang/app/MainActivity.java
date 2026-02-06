package com.taemindang.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Mixed Content 허용: https://localhost 페이지에서 http://10.0.2.2 API 요청
    if (getBridge() != null && getBridge().getWebView() != null) {
      getBridge().getWebView().post(() -> {
        WebView wv = getBridge().getWebView();
        if (wv != null) {
          wv.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        }
      });
    }
  }
}
