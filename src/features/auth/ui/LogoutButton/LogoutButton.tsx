import { Button } from '@/shared/ui/Button'
import { useLogout } from '../../model/use-logout'

export function LogoutButton() {
  const logout = useLogout()

  return (
    <Button variant="ghost" className='no-padding' onClick={logout}>
      Выйти
    </Button>
  )
}
