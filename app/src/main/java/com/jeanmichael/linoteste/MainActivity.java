package com.jeanmichael.linoteste;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
public class MainActivity extends Activity {
 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  WebView view=new WebView(this);
  view.setWebViewClient(new WebViewClient());
  view.getSettings().setJavaScriptEnabled(true);
  view.getSettings().setDomStorageEnabled(true);
  setContentView(view);
  try(InputStream in=getAssets().open("index.html");ByteArrayOutputStream out=new ByteArrayOutputStream()){
   byte[] buf=new byte[8192];int n;while((n=in.read(buf))!=-1)out.write(buf,0,n);
   String html=out.toString("UTF-8");
   view.loadDataWithBaseURL("https://evfjvnkaamkhsxzvkpex.supabase.co/",html,"text/html","UTF-8",null);
  }catch(Exception e){view.loadData("<h3>Erro ao carregar interface local</h3>","text/html","UTF-8");}
 }
}
