import { getAdminSiteSettings } from '@/actions/admin'
import { SettingForm } from '@/components/admin/setting-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SITE_SETTING_GROUPS } from '@/lib/site-settings'

export default async function ConfiguracionPage() {
  const settings = await getAdminSiteSettings()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configuración</h1>
        <p className="text-muted-foreground">
          Gestioná los textos públicos obligatorios sin crear ni eliminar claves requeridas.
        </p>
      </div>

      <div className="space-y-6">
        {SITE_SETTING_GROUPS.map(({ group, title }) => {
          const groupSettings = settings.filter((setting) => setting.group === group)

          if (groupSettings.length === 0) {
            return null
          }

          return (
            <Card key={group} className="border-border bg-white shadow-sm">
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                {groupSettings.map((setting) => (
                  <SettingForm key={setting.key} setting={setting} />
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
