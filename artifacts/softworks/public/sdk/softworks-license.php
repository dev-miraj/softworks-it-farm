<?php
/**
 * SOFTWORKS License SDK v2.0 (PHP)
 * Military-Grade Software License Protection
 *
 * Usage:
 *   require_once 'softworks-license.php';
 *   
 *   $license = new SoftworksLicense([
 *       'license_key' => 'SW-XXXX-XXXX-XXXX',
 *       'server_url'  => 'https://softworksit.vercel.app',
 *       'domain'      => $_SERVER['HTTP_HOST'] ?? '',
 *   ]);
 *
 *   // Activate (first time)
 *   $result = $license->activate();
 *   if (!$result['success']) die('License activation failed: ' . $result['error']);
 *
 *   // Validate (subsequent checks)
 *   $result = $license->validate();
 *   if (!$result['data']['valid']) die('Invalid license: ' . $result['data']['error']);
 *
 *   // Heartbeat (periodic)
 *   $license->heartbeat();
 *
 *   // Deactivate
 *   $license->deactivate();
 */

class SoftworksLicense {
    private $config;
    private $fingerprint;
    
    const SDK_VERSION = '2.0.0';

    public function __construct(array $config = []) {
        $this->config = array_merge([
            'license_key' => '',
            'server_url'  => '',
            'domain'      => $_SERVER['HTTP_HOST'] ?? php_uname('n'),
            'timeout'     => 30,
            'verify_ssl'  => true,
            'debug'       => false,
        ], $config);
        
        $this->fingerprint = $this->generateFingerprint();
    }

    private function generateFingerprint(): string {
        $data = implode('|', [
            php_uname('s'),
            php_uname('n'),
            php_uname('r'),
            php_uname('m'),
            PHP_VERSION,
            $_SERVER['SERVER_SOFTWARE'] ?? 'cli',
            $_SERVER['DOCUMENT_ROOT'] ?? __DIR__,
        ]);
        return 'php-' . substr(md5($data), 0, 16);
    }

    private function request(string $endpoint, array $data): array {
        $url = rtrim($this->config['server_url'], '/') . '/api/' . $endpoint;
        $body = json_encode($data);
        $timestamp = time();

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $this->config['timeout'],
            CURLOPT_SSL_VERIFYPEER => $this->config['verify_ssl'],
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'X-SDK-Version: ' . self::SDK_VERSION,
                'X-Timestamp: ' . $timestamp,
                'Content-Length: ' . strlen($body),
            ],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            $this->log('CURL error: ' . $error);
            return ['success' => false, 'error' => 'Connection failed: ' . $error];
        }

        if ($httpCode === 429) {
            return ['success' => false, 'error' => 'Rate limit exceeded. Try again later.'];
        }

        $result = json_decode($response, true);
        if ($result === null) {
            return ['success' => false, 'error' => 'Invalid response from server'];
        }

        return $result;
    }

    public function activate(): array {
        $this->log('Activating license: ' . $this->config['license_key']);
        
        $result = $this->request('license/activate', [
            'license_key' => $this->config['license_key'],
            'domain'      => $this->config['domain'],
            'hardware_id' => $this->fingerprint,
            'ip_address'  => $_SERVER['SERVER_ADDR'] ?? '',
            'user_agent'  => 'PHP/' . PHP_VERSION . ' SoftworksSDK/' . self::SDK_VERSION,
            'fingerprint' => $this->fingerprint,
        ]);

        if (!empty($result['success'])) {
            $this->log('Activation successful');
        } else {
            $this->log('Activation failed: ' . ($result['error'] ?? 'Unknown'));
        }

        return $result;
    }

    public function validate(): array {
        $this->log('Validating license: ' . $this->config['license_key']);
        
        $result = $this->request('license/validate', [
            'license_key' => $this->config['license_key'],
            'domain'      => $this->config['domain'],
            'hardware_id' => $this->fingerprint,
            'ip_address'  => $_SERVER['SERVER_ADDR'] ?? '',
        ]);

        $data = $result['data'] ?? $result;
        
        if (!empty($data['valid'])) {
            $this->log('License is valid');
            if (!empty($data['payment_warning'])) {
                $this->log('Payment warning: ' . ($data['warning_message'] ?? ''));
            }
        } else {
            $this->log('License is invalid: ' . ($data['error'] ?? 'Unknown'));
        }

        return $result;
    }

    public function heartbeat(): array {
        return $this->request('license/heartbeat', [
            'license_key' => $this->config['license_key'],
            'domain'      => $this->config['domain'],
            'hardware_id' => $this->fingerprint,
        ]);
    }

    public function deactivate(): array {
        return $this->request('license/deactivate', [
            'license_key' => $this->config['license_key'],
            'domain'      => $this->config['domain'],
            'hardware_id' => $this->fingerprint,
        ]);
    }

    public function check(): array {
        $url = rtrim($this->config['server_url'], '/') . '/api/license/check/' . urlencode($this->config['license_key']);
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $this->config['timeout'],
            CURLOPT_SSL_VERIFYPEER => $this->config['verify_ssl'],
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        return json_decode($response, true) ?? ['found' => false];
    }

    public function isValid(): bool {
        $result = $this->validate();
        $data = $result['data'] ?? $result;
        return !empty($data['valid']);
    }

    public function enforceOrDie(string $message = 'License validation failed. Access denied.'): void {
        if (!$this->isValid()) {
            http_response_code(403);
            die($message);
        }
    }

    private function log(string $message): void {
        if ($this->config['debug']) {
            error_log('[SoftworksLicense] ' . $message);
        }
    }
}
