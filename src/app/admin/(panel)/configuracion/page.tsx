import { getAdminSiteSettings, updateSiteSetting } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SITE_SETTING_GROUPS, type AdminSiteSetting } from '@/lib/site-settings'

function SettingValueField({ setting }: { setting: AdminSiteSetting }) {
  if (setting.input === 'textarea' || setting.input === 'json') {
    return (
      <Textarea
        id={setting.key}
        name="setting_value"
        defaultValue={setting.displayValue}
        rows={setting.input === 'json' ? 8 : 4}
        required
        className="font-mono text-sm"
      />
    )
  }

  return <Input id={setting.key} name="setting_value" defaultValue={setting.displayValue} required />
}

function SettingForm({ setting }: { setting: AdminSiteSetting }) {
  return (
    <form action={updateSiteSetting} className="space-y-3 rounded-lg border border-border bg-white p-4">
      <input type="hidden" name="setting_key" value={setting.key} />
      <input type="hidden" name="setting_type" value={setting.type} />

      <div className="space-y-1">
        <label htmlFor={setting.key} className="text-sm font-semibold text-foreground">
          {setting.label}
        </label>
        <p className="text-xs text-muted-foreground">{setting.description}</p>
      </div>

      <SettingValueField setting={setting} />

      <div className="flex items-center justify-between gap-4">
        <code className="text-xs text-muted-foreground">{setting.key}</code>
        <Button type="submit" className="bg-secondary text-white hover:bg-secondary/90">
          Guardar
        </Button>
      </div>
    </form>
  )
}

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
