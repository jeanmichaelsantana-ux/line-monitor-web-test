package com.jeanmichael.linoteste;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.webkit.JavascriptInterface;
import java.util.Locale;
import android.os.Message;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;

public class MainActivity extends Activity {
 private TextToSpeech tts;
 private volatile boolean ttsReady=false;
 private final class LinoVoiceBridge {
  @JavascriptInterface public void selectVoice(String voice) { }
  @JavascriptInterface public void speak(String message) { runOnUiThread(() -> { if(ttsReady && message!=null) { tts.stop(); tts.speak(message,TextToSpeech.QUEUE_FLUSH,null,"lino-voice"); } else { android.widget.Toast.makeText(MainActivity.this,"Ative a voz em português nas configurações de texto para fala do Android.",android.widget.Toast.LENGTH_LONG).show(); } }); }
  @JavascriptInterface public void stop() { runOnUiThread(() -> { if(tts!=null) tts.stop(); }); }
  @JavascriptInterface public boolean isSpeaking() { return tts!=null && tts.isSpeaking(); }
 }
 @Override protected void onDestroy() { if(tts!=null) {tts.stop();tts.shutdown();} super.onDestroy(); }
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
  tts=new TextToSpeech(this, status -> { if(status==TextToSpeech.SUCCESS) { int result=tts.setLanguage(new Locale("pt","BR")); tts.setPitch(0.85f);tts.setSpeechRate(1.0f);ttsReady=(result!=TextToSpeech.LANG_MISSING_DATA && result!=TextToSpeech.LANG_NOT_SUPPORTED); } });
  WebView view = new WebView(this);
  view.addJavascriptInterface(new LinoVoiceBridge(), "LinoVoice");
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
