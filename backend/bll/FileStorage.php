<?php
/**
 * Camada de Lógica de Negócio (BLL) - guardar ficheiros enviados nos formulários.
 *
 * Regras:
 *   - só aceita PDF, JPG e PNG (a foto de perfil só JPG e PNG)
 *   - máximo 5 MB por ficheiro
 *   - o ficheiro é guardado com um nome aleatório (nunca com o nome original,
 *     para não haver ficheiros por cima de outros nem nomes perigosos)
 *
 * Os ficheiros ficam em backend/uploads/<pasta>/ e na BD guarda-se o caminho
 * relativo à pasta do projeto, ex.: "backend/uploads/couriers/a1b2c3....pdf".
 */

class FileStorage
{
    private const MAX_BYTES = 5 * 1024 * 1024;

    /** Ficheiros guardados neste pedido, para se poderem apagar se o registo falhar. */
    private array $saved = [];

    /**
     * Guarda um ficheiro enviado. Devolve o caminho guardado, ou null se não foi enviado nenhum.
     *
     * @param array|null $file   uma entrada de $_FILES (com name, tmp_name, size, error)
     * @param string     $folder subpasta dentro de backend/uploads (ex.: "couriers")
     * @param string     $label  nome do documento para as mensagens de erro
     * @param bool       $imageOnly true para aceitar só JPG/PNG
     */
    public function save(?array $file, string $folder, string $label, bool $imageOnly = false): ?string
    {
        // Campo de ficheiro vazio: não é erro, os documentos são opcionais
        if ($file === null || ($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
            return null;
        }
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new InvalidArgumentException("$label: the file could not be uploaded. Try again.");
        }
        if ($file['size'] > self::MAX_BYTES) {
            throw new InvalidArgumentException("$label: the file cannot exceed 5 MB.");
        }

        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed   = $imageOnly ? ['jpg', 'jpeg', 'png'] : ['pdf', 'jpg', 'jpeg', 'png'];
        if (!in_array($extension, $allowed, true)) {
            throw new InvalidArgumentException("$label: use " . ($imageOnly ? 'a JPG or PNG' : 'a PDF, JPG or PNG') . ' file.');
        }

        $directory = __DIR__ . '/../uploads/' . $folder;
        if (!is_dir($directory)) {
            mkdir($directory, 0775, true);
        }

        $fileName = bin2hex(random_bytes(16)) . '.' . $extension;
        if (!move_uploaded_file($file['tmp_name'], $directory . '/' . $fileName)) {
            throw new RuntimeException("$label: the file could not be saved on the server.");
        }

        $this->saved[] = $directory . '/' . $fileName;
        return 'backend/uploads/' . $folder . '/' . $fileName;
    }

    /** Apaga os ficheiros guardados neste pedido (usado quando o registo falha). */
    public function deleteSaved(): void
    {
        foreach ($this->saved as $path) {
            if (is_file($path)) {
                unlink($path);
            }
        }
        $this->saved = [];
    }
}
