package com.jeanmichael.linoteste;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Message;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;

public class MainActivity extends Activity {
 private void openExternal(String url) {
  if (url == null || !(url.startsWith("https://") || url.startsWith("http://"))) return;
  try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))); }
  catch (Exception e) { android.widget.Toast.makeText(this, "Não foi possível abrir o manual. Verifique o navegador e o link.", android.widget.Toast.LENGTH_LONG).show(); }
 }
 private WebViewClient navigationClient() {
  return new WebViewClient() {
   @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
    Uri uri = request.getUrl();
    String url = uri.toString();
    if (request.isForMainFrame() && (url.startsWith("https://") || url.startsWith("http://"))
        && !url.startsWith("https://evfjvnkaamkhsxzvkpex.supabase.co/")) {
     openExternal(url); return true;
    }
    return false;
   }
   @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
    if ((url.startsWith("https://") || url.startsWith("http://"))
        && !url.startsWith("https://evfjvnkaamkhsxzvkpex.supabase.co/")) {
     openExternal(url); return true;
    }
    return false;
   }
  };
 }
 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  WebView view = new WebView(this);
  view.setWebViewClient(navigationClient());
  view.getSettings().setJavaScriptEnabled(true);
  view.getSettings().setDomStorageEnabled(true);
  view.getSettings().setSupportMultipleWindows(true);
  view.getSettings().setJavaScriptCanOpenWindowsAutomatically(true);
  view.setWebChromeClient(new WebChromeClient() {
   @Override public boolean onCreateWindow(WebView parent, boolean dialog, boolean userGesture, Message resultMsg) {
    WebView popup = new WebView(MainActivity.this);
    popup.setWebViewClient(new WebViewClient() {
     @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest request) {
      openExternal(request.getUrl().toString()); return true;
     }
     @Override public boolean shouldOverrideUrlLoading(WebView v, String url) {
      openExternal(url); return true;
     }
     @Override public void onPageStarted(WebView v, String url, android.graphics.Bitmap favicon) {
      if (url.startsWith("https://") || url.startsWith("http://")) openExternal(url);
      v.stopLoading();
     }
    });
    WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
    transport.setWebView(popup);
    resultMsg.sendToTarget();
    return true;
   }
  });
  setContentView(view);
  try (InputStream in = getAssets().open("index.html"); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
   byte[] buf = new byte[8192]; int n;
   while ((n = in.read(buf)) != -1) out.write(buf, 0, n);
   view.loadDataWithBaseURL("https://evfjvnkaamkhsxzvkpex.supabase.co/", out.toString("UTF-8"), "text/html", "UTF-8", null);
  } catch (Exception e) {
   view.loadData("<h3>Erro ao carregar interface local</h3>", "text/html", "UTF-8");
  }
 }
}
