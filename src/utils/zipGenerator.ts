import JSZip from 'jszip';
import { ApkBuildConfig } from '../types';
import {
  generateActivityMainXml,
  generateActivitySplashXml,
  generateAndroidManifest,
  generateAppBuildGradle,
  generateAppConfigJson,
  generateColorsXml,
  generateGitHubWorkflow,
  generateMainActivity,
  generateReadme,
  generateRootBuildGradle,
  generateSettingsGradle,
  generateSplashActivity,
  generateStylesXml,
} from './codeGenerator';

// Minimal gradle wrapper properties
const GRADLE_WRAPPER_PROPERTIES = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.5-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;

// Standard gradlew unix bash script
const GRADLEW_SCRIPT = `#!/bin/sh
# Gradle start up script for POSIX generated for APK Creator
DEFAULT_JVM_OPTS='"-Xmx64m" "-Xms64m"'
JAVACMD="java"
which "$JAVACMD" >/dev/null 2>&1 || JAVACMD="java"
DIRNAME=\`dirname "$0"\`
APP_HOME=\`cd "$DIRNAME" && pwd\`
CLASSPATH=$APP_HOME/gradle/wrapper/gradle-wrapper.jar
exec "$JAVACMD" $DEFAULT_JVM_OPTS -classpath "$CLASSPATH" org.gradle.wrapper.GradleWrapperMain "$@"
`;

// Standard gradlew.bat windows script
const GRADLEW_BAT = `@rem Gradle startup script for Windows
@if "%DEBUG%"=="" @echo off
setlocal
set DIRNAME=%~dp0
if "%DIRNAME%"=="" set DIRNAME=.
set APP_HOME=%DIRNAME%
set CLASSPATH=%APP_HOME%gradle\\wrapper\\gradle-wrapper.jar
java -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*
`;

export async function generateProjectZip(config: ApkBuildConfig): Promise<Blob> {
  const zip = new JSZip();

  const packagePath = config.identity.packageName.replace(/\./g, '/');

  // Root files
  zip.file('build.gradle.kts', generateRootBuildGradle());
  zip.file('settings.gradle.kts', generateSettingsGradle(config));
  zip.file('README.md', generateReadme(config));
  zip.file('app-config.json', generateAppConfigJson(config));
  zip.file('gradlew', GRADLEW_SCRIPT, { unixPermissions: '755' });
  zip.file('gradlew.bat', GRADLEW_BAT);

  // Gradle wrapper
  zip.file('gradle/wrapper/gradle-wrapper.properties', GRADLE_WRAPPER_PROPERTIES);

  // GitHub Actions workflow
  zip.file('.github/workflows/build-apk.yml', generateGitHubWorkflow(config));

  // App module files
  zip.file('app/build.gradle.kts', generateAppBuildGradle(config));
  zip.file('app/proguard-rules.pro', '# Proguard rules\n-keepattributes *Annotation*\n-keepclassmembers class * {\n   @android.webkit.JavascriptInterface <methods>;\n}');
  zip.file('app/src/main/AndroidManifest.xml', generateAndroidManifest(config));

  // Kotlin source code
  zip.file(`app/src/main/java/${packagePath}/MainActivity.kt`, generateMainActivity(config));
  zip.file(`app/src/main/java/${packagePath}/SplashActivity.kt`, generateSplashActivity(config));

  // XML Layouts & Resources
  zip.file('app/src/main/res/layout/activity_main.xml', generateActivityMainXml(config));
  zip.file('app/src/main/res/layout/activity_splash.xml', generateActivitySplashXml(config));
  zip.file('app/src/main/res/values/colors.xml', generateColorsXml(config));
  zip.file('app/src/main/res/values/styles.xml', generateStylesXml(config));

  // Provide vector placeholder for splash graphic
  const splashVectorXml = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="128dp"
    android:height="128dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
  <path
      android:fillColor="#FFFFFF"
      android:pathData="M12,2L2,7l10,5 10,-5 -10,-5zM2,17l10,5 10,-5M2,12l10,5 10,-5"/>
</vector>`;
  zip.file('app/src/main/res/drawable/splash_graphic.xml', splashVectorXml);

  return await zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
