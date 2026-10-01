# ASPGE-PA — App Mobile (Capacitor)

Shell nativo que carrega `https://aspgepa.org.br` em WebView. O conteúdo do app é
sempre o site em produção — deploys no portal refletem imediatamente, sem
republish nas lojas.

- **App ID:** `br.org.aspgepa.app`
- **Plataformas:** `android/` (Android Studio/Gradle) e `ios/` (Xcode)
- **Plugins:** `@capacitor/splash-screen`, `@capacitor/status-bar`

## Requisitos

| Plataforma | Ferramenta | Custo |
|------------|-----------|-------|
| Android | Android Studio + JDK 17 | Play Console: US$ 25 (único) |
| iOS | **macOS** + Xcode + CocoaPods | Apple Developer: US$ 99/ano |

> iOS só compila em macOS. Sem Mac, use um serviço CI como Codemagic/EAS ou alugue um Mac in Cloud.

## Build

```bash
cd mobile
npm install
npx cap sync          # copia www + config p/ android/ e ios/
npx cap open android  # abre no Android Studio
npx cap open ios      # abre no Xcode (só macOS)
```

### Android (Play Store)

1. No Android Studio: **Build → Generate Signed App Bundle (.aab)**
2. Crie um keystore (`keytool`) e **guarde-o com segurança** — perder a chave impede updates
3. Upload do `.aab` no Play Console → teste interno → produção

### iOS (App Store)

1. No Xcode: `Signing & Capabilities` → selecionar time Apple Developer
2. **Product → Archive** → Upload para App Store Connect
3. Preencher metadados + **Privacy Manifest** (declarar dados coletados — temos LGPD)

## Atenção — revisão da Apple (guideline 4.2)

Apps "wrapper" puros podem ser rejeitados por "funcionalidade mínima". Para aprovar:
- Já incluímos splash nativa + status bar temática
- Recomendado adicionar **push notifications** (`@capacitor/push-notifications`) e/ou **biometria** (`@capacitor/preferences` + FaceID) — features nativas que justificam o app
- Na descrição da loja, enfatize carteirinha digital offline/notificações de votações

## Estrutura

```
mobile/
├── capacitor.config.json  # appId, server.url, plugins
├── www/index.html         # fallback (redireciona p/ o site)
├── android/               # projeto Android Studio
└── ios/                   # projeto Xcode (App.xcodeproj)
```

## Deploy web vs. app

Como o app aponta para produção, **não é preciso republicar** a cada mudança do
portal. Só republique ao mudar: ícone/nome do app, plugins nativos ou `appId`.
