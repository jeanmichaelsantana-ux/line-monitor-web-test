package com.jeanmichael.linoteste;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
public class MainActivity extends Activity {
 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  WebView view=new WebView(this);
  view.setWebViewClient(new WebViewClient());
  view.getSettings().setJavaScriptEnabled(true);
  view.getSettings().setDomStorageEnabled(true);
  setContentView(view);
  view.loadUrl("file:///android_asset/index.html");
 }
}
