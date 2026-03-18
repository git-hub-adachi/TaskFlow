import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

interface AdminAuthProps {
  onSuccess?: () => void
}

const AdminAuth: React.FC<AdminAuthProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw signInError

      // ログイン後にroleを検証する
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile) {
        await supabase.auth.signOut()
        throw new Error('プロフィールの取得に失敗しました')
      }

      if (profile.role !== 'admin') {
        await supabase.auth.signOut()
        throw new Error('このアカウントには管理者権限がありません。メンバーログインをご利用ください。')
      }

      onSuccess?.()
    } catch (err: unknown) {
      setError(getJapaneseError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* 背景グロー */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-teal-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md w-full">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-2xl shadow-teal-500/30 bg-gradient-to-br from-teal-500 to-cyan-600">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">管理者ログイン</h1>
          <p className="mt-1 text-slate-400 text-sm">TaskFlow 管理者専用</p>
        </div>

        {/* カード */}
        <div className="bg-slate-900/80 backdrop-blur border border-slate-700/60 rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSignIn} className="space-y-4">
            {/* エラー */}
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/40 text-red-400 text-sm px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 5a7 7 0 100 14A7 7 0 0012 5z" />
                </svg>
                {error}
              </div>
            )}

            {/* メールアドレス */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide uppercase">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className={inputClass}
                required
                autoComplete="email"
              />
            </div>

            {/* パスワード */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide uppercase">
                パスワード
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass + ' pr-12'}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                >
                  {showPassword ? <EyeOff /> : <EyeOn />}
                </button>
              </div>
            </div>

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Spinner />
                  ログイン中...
                </>
              ) : (
                'ログイン'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-600">
            管理者アカウントはシステム管理者にお問い合わせください
          </p>
        </div>
      </div>
    </div>
  )
}

// ---- 補助コンポーネント ----

const inputClass =
  'w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-teal-500/70 focus:border-teal-500/50 transition-all text-sm'

const Spinner = () => (
  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
  </svg>
)

const EyeOn = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EyeOff = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
)

function getJapaneseError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('Invalid login credentials')) return 'メールアドレスまたはパスワードが正しくありません'
  if (msg.includes('Email not confirmed')) return 'メールアドレスの確認が完了していません。確認メールをご確認ください'
  if (msg.includes('Password should be at least')) return 'パスワードは6文字以上で入力してください'
  if (msg.includes('Email rate limit exceeded')) return 'しばらく時間をおいてから再試行してください'
  if (msg.includes('Network')) return 'ネットワークエラーが発生しました。接続を確認してください'
  if (msg.includes('管理者権限がありません')) return msg
  if (msg.includes('プロフィールの取得に失敗')) return msg
  return `エラーが発生しました: ${msg}`
}

export default AdminAuth
