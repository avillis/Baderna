<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Redefinir senha · Baderna</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
  body, table, div, p, a, span { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important; }
</style>
</head>
<body style="margin:0;padding:0;background-color:#f7f7f7;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f0f0f;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f7f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          {{-- Hero card laranja --}}
          <tr>
            <td style="background-color:#ff4100;border-radius:28px;padding:56px 48px 80px 48px;">
              <img
                src="https://bdrn.com.br/logo.png"
                alt="Baderna"
                width="56"
                height="40"
                style="display:block;border:0;outline:none;margin-bottom:80px;height:40px;width:auto;"
              >
              <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:72px;line-height:0.92;font-weight:700;color:#ffffff;letter-spacing:-0.02em;">
                Redefinir<br>sua senha
              </div>
            </td>
          </tr>

          <tr><td style="height:20px;line-height:20px;font-size:0;">&nbsp;</td></tr>

          {{-- Card de conteúdo --}}
          <tr>
            <td style="background-color:#ffffff;border-radius:24px;padding:36px 32px;">
              <p style="margin:0 0 14px 0;font-size:18px;font-weight:700;letter-spacing:-0.03em;color:#0f0f0f;">
                E aí, {{ $name }}
              </p>
              <p style="margin:0 0 22px 0;font-size:14px;line-height:1.6;color:#7c7c7c;">
                Recebemos um pedido de redefinição de senha pra sua conta na Baderna. Se foi você, clica no botão abaixo pra escolher uma nova:
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background-color:#ff4100;border-radius:16px;">
                    <a href="{{ $url }}" target="_blank" style="display:inline-block;padding:16px 28px;font-size:14px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;text-decoration:none;">
                      Redefinir senha
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0;font-size:12px;line-height:1.5;color:#a8a8a8;text-align:center;">
                Esse link expira em {{ $minutes }} minutos. Se você não pediu redefinição, pode ignorar esse email — sua senha continua a mesma.
              </p>
            </td>
          </tr>

          <tr><td style="height:16px;line-height:16px;font-size:0;">&nbsp;</td></tr>

          {{-- Fallback URL --}}
          <tr>
            <td style="background-color:#ffffff;border-radius:24px;padding:24px 28px;">
              <p style="margin:0 0 10px 0;font-size:12px;font-weight:600;color:#8d8d8d;">
                Botão não funciona? Cola esse link no navegador:
              </p>
              <p style="margin:0;font-size:11px;line-height:1.5;color:#0f0f0f;word-break:break-all;">
                <a href="{{ $url }}" target="_blank" style="color:#ff4100;text-decoration:none;">{{ $url }}</a>
              </p>
            </td>
          </tr>

          <tr><td style="height:20px;line-height:20px;font-size:0;">&nbsp;</td></tr>

          {{-- Footer --}}
          <tr>
            <td style="padding:0 12px;text-align:center;">
              <p style="margin:0;font-size:11px;color:#b0a8a4;">
                © {{ date('Y') }} Baderna · bdrn.com.br
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
