package com.jeanmichael.linoteste;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
public class MainActivity extends Activity {
 @Override public void onCreate(Bundle state) {
 super.onCreate(state);
 WebView view = new WebView(this);
 view.getSettings().setJavaScriptEnabled(true);
 setContentView(view);
 view.loadUrl("https://line-monitor-web-test.vercel.app/");
 }
}
