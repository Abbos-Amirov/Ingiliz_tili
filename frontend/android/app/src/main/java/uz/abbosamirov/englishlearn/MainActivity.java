package uz.abbosamirov.englishlearn;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Android WebView (unlike the standalone Chrome app) requires an
        // explicit user gesture before it will play <audio>/<video> by
        // default, and its gesture detection is stricter than Chrome's —
        // taps routed through React/Framer Motion's synthetic event system
        // don't always register as "trusted" to it, so word/sentence
        // pronunciation clips played silently failed inside the APK while
        // working fine in a real mobile browser. Disabling the requirement
        // here (the whole app is trusted, first-party content) fixes it.
        getBridge().getWebView().getSettings().setMediaPlaybackRequiresUserGesture(false);
    }
}
