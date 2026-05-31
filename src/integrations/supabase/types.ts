export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_type: string
          apt: string | null
          city: string | null
          country: string | null
          created_at: string
          from_date: string | null
          id: string
          is_current: boolean | null
          person_id: string
          state: string | null
          street: string | null
          to_date: string | null
          zip: string | null
        }
        Insert: {
          address_type?: string
          apt?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          from_date?: string | null
          id?: string
          is_current?: boolean | null
          person_id: string
          state?: string | null
          street?: string | null
          to_date?: string | null
          zip?: string | null
        }
        Update: {
          address_type?: string
          apt?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          from_date?: string | null
          id?: string
          is_current?: boolean | null
          person_id?: string
          state?: string | null
          street?: string | null
          to_date?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_attributions: {
        Row: {
          affiliate_id: string
          attributed_at: string
          attribution_expires_at: string
          attribution_model: string
          click_id: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          affiliate_id: string
          attributed_at?: string
          attribution_expires_at: string
          attribution_model?: string
          click_id?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          affiliate_id?: string
          attributed_at?: string
          attribution_expires_at?: string
          attribution_model?: string
          click_id?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_attributions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_attributions_click_id_fkey"
            columns: ["click_id"]
            isOneToOne: false
            referencedRelation: "affiliate_clicks"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          click_token: string
          clicked_at: string
          id: string
          ip_hash: string | null
          referrer_url: string | null
          user_agent: string | null
        }
        Insert: {
          affiliate_id: string
          click_token?: string
          clicked_at?: string
          id?: string
          ip_hash?: string | null
          referrer_url?: string | null
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string
          click_token?: string
          clicked_at?: string
          id?: string
          ip_hash?: string | null
          referrer_url?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          approved_at: string | null
          commission_amount: number
          created_at: string
          earned_at: string
          gross_amount: number
          id: string
          paid_at: string | null
          payout_id: string | null
          revenue_type: Database["public"]["Enums"]["revenue_type"]
          source_id: string | null
          status: Database["public"]["Enums"]["commission_status"]
          user_id: string
        }
        Insert: {
          affiliate_id: string
          approved_at?: string | null
          commission_amount?: number
          created_at?: string
          earned_at?: string
          gross_amount?: number
          id?: string
          paid_at?: string | null
          payout_id?: string | null
          revenue_type: Database["public"]["Enums"]["revenue_type"]
          source_id?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          user_id: string
        }
        Update: {
          affiliate_id?: string
          approved_at?: string | null
          commission_amount?: number
          created_at?: string
          earned_at?: string
          gross_amount?: number
          id?: string
          paid_at?: string | null
          payout_id?: string | null
          revenue_type?: Database["public"]["Enums"]["revenue_type"]
          source_id?: string | null
          status?: Database["public"]["Enums"]["commission_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "affiliate_payouts"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_notifications: {
        Row: {
          affiliate_id: string
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_notifications_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          affiliate_id: string
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_reference: string | null
          payout_period_end: string
          payout_period_start: string
          status: Database["public"]["Enums"]["payout_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          payout_period_end: string
          payout_period_start: string
          status?: Database["public"]["Enums"]["payout_status"]
          total_amount?: number
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_reference?: string | null
          payout_period_end?: string
          payout_period_start?: string
          status?: Database["public"]["Enums"]["payout_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_code: string
          attribution_window_days: number
          compliance_status: Database["public"]["Enums"]["compliance_status"]
          cookie_duration_days: number
          created_at: string
          created_by: string | null
          display_name: string
          email: string | null
          export_commission_pct: number
          fraud_hold: boolean
          id: string
          is_active: boolean
          min_payout_amount: number
          notes: string | null
          payment_method: string | null
          payout_model: Database["public"]["Enums"]["affiliate_payout_model"]
          payout_term_months: number
          subscription_commission_pct: number
          tax_status: Database["public"]["Enums"]["compliance_status"]
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          affiliate_code: string
          attribution_window_days?: number
          compliance_status?: Database["public"]["Enums"]["compliance_status"]
          cookie_duration_days?: number
          created_at?: string
          created_by?: string | null
          display_name: string
          email?: string | null
          export_commission_pct?: number
          fraud_hold?: boolean
          id?: string
          is_active?: boolean
          min_payout_amount?: number
          notes?: string | null
          payment_method?: string | null
          payout_model?: Database["public"]["Enums"]["affiliate_payout_model"]
          payout_term_months?: number
          subscription_commission_pct?: number
          tax_status?: Database["public"]["Enums"]["compliance_status"]
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          affiliate_code?: string
          attribution_window_days?: number
          compliance_status?: Database["public"]["Enums"]["compliance_status"]
          cookie_duration_days?: number
          created_at?: string
          created_by?: string | null
          display_name?: string
          email?: string | null
          export_commission_pct?: number
          fraud_hold?: boolean
          id?: string
          is_active?: boolean
          min_payout_amount?: number
          notes?: string | null
          payment_method?: string | null
          payout_model?: Database["public"]["Enums"]["affiliate_payout_model"]
          payout_term_months?: number
          subscription_commission_pct?: number
          tax_status?: Database["public"]["Enums"]["compliance_status"]
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      attorney_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          case_id: string
          collaborator_type: Database["public"]["Enums"]["collaborator_type"]
          created_at: string
          expires_at: string
          id: string
          invited_by: string
          invited_email: string
          permissions: Json
          selected_forms: string[]
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          case_id: string
          collaborator_type?: Database["public"]["Enums"]["collaborator_type"]
          created_at?: string
          expires_at?: string
          id?: string
          invited_by: string
          invited_email: string
          permissions?: Json
          selected_forms?: string[]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          case_id?: string
          collaborator_type?: Database["public"]["Enums"]["collaborator_type"]
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string
          invited_email?: string
          permissions?: Json
          selected_forms?: string[]
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attorney_invitations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action_type: string
          after_state: Json | null
          before_state: Json | null
          case_id: string | null
          created_at: string
          error_details: string | null
          human_label: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          module: string
          record_id: string | null
          session_id: string | null
          success: boolean
          target_id: string | null
          target_type: string | null
          user_agent: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action_type: string
          after_state?: Json | null
          before_state?: Json | null
          case_id?: string | null
          created_at?: string
          error_details?: string | null
          human_label?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          module: string
          record_id?: string | null
          session_id?: string | null
          success?: boolean
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action_type?: string
          after_state?: Json | null
          before_state?: Json | null
          case_id?: string | null
          created_at?: string
          error_details?: string | null
          human_label?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          module?: string
          record_id?: string | null
          session_id?: string | null
          success?: boolean
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      business_formation_profiles: {
        Row: {
          address: Json
          created_at: string
          ein: string | null
          entity_type: string
          formation_date: string | null
          id: string
          linked_tax_client_id: string | null
          notes: string | null
          organizer: Json
          owner_user_id: string
          proposed_name: string
          state: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: Json
          created_at?: string
          ein?: string | null
          entity_type: string
          formation_date?: string | null
          id?: string
          linked_tax_client_id?: string | null
          notes?: string | null
          organizer?: Json
          owner_user_id: string
          proposed_name: string
          state: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: Json
          created_at?: string
          ein?: string | null
          entity_type?: string
          formation_date?: string | null
          id?: string
          linked_tax_client_id?: string | null
          notes?: string | null
          organizer?: Json
          owner_user_id?: string
          proposed_name?: string
          state?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_formation_profiles_linked_tax_client_id_fkey"
            columns: ["linked_tax_client_id"]
            isOneToOne: false
            referencedRelation: "tax_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      business_listings: {
        Row: {
          admin_notes: string | null
          amount_sought: number | null
          business_stage: string | null
          category: Database["public"]["Enums"]["listing_category"]
          company_name: string
          contact_method: string | null
          created_at: string
          disclaimer_accepted: boolean
          expires_at: string | null
          founder_overview: string | null
          id: string
          industry: string
          marketplace_mode: Database["public"]["Enums"]["marketplace_mode"]
          published_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          state: string
          status: Database["public"]["Enums"]["listing_status"]
          summary: string
          traction: string | null
          updated_at: string
          use_of_funds: string | null
          user_id: string
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount_sought?: number | null
          business_stage?: string | null
          category?: Database["public"]["Enums"]["listing_category"]
          company_name: string
          contact_method?: string | null
          created_at?: string
          disclaimer_accepted?: boolean
          expires_at?: string | null
          founder_overview?: string | null
          id?: string
          industry: string
          marketplace_mode?: Database["public"]["Enums"]["marketplace_mode"]
          published_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state: string
          status?: Database["public"]["Enums"]["listing_status"]
          summary: string
          traction?: string | null
          updated_at?: string
          use_of_funds?: string | null
          user_id: string
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount_sought?: number | null
          business_stage?: string | null
          category?: Database["public"]["Enums"]["listing_category"]
          company_name?: string
          contact_method?: string | null
          created_at?: string
          disclaimer_accepted?: boolean
          expires_at?: string | null
          founder_overview?: string | null
          id?: string
          industry?: string
          marketplace_mode?: Database["public"]["Enums"]["marketplace_mode"]
          published_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string
          status?: Database["public"]["Enums"]["listing_status"]
          summary?: string
          traction?: string | null
          updated_at?: string
          use_of_funds?: string | null
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      case_exports: {
        Row: {
          case_id: string
          created_at: string
          documents_included: string[] | null
          error_message: string | null
          export_type: string
          file_name: string | null
          file_path: string | null
          forms_included: string[] | null
          id: string
          metadata: Json | null
          missing_documents: string[] | null
          missing_fields: string[] | null
          status: string
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          documents_included?: string[] | null
          error_message?: string | null
          export_type?: string
          file_name?: string | null
          file_path?: string | null
          forms_included?: string[] | null
          id?: string
          metadata?: Json | null
          missing_documents?: string[] | null
          missing_fields?: string[] | null
          status?: string
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          documents_included?: string[] | null
          error_message?: string | null
          export_type?: string
          file_name?: string | null
          file_path?: string | null
          forms_included?: string[] | null
          id?: string
          metadata?: Json | null
          missing_documents?: string[] | null
          missing_fields?: string[] | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_exports_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_messages: {
        Row: {
          case_id: string
          content: string
          created_at: string
          id: string
          read: boolean | null
          sender_id: string | null
          sender_name: string
          sender_role: Database["public"]["Enums"]["message_sender_role"]
        }
        Insert: {
          case_id: string
          content: string
          created_at?: string
          id?: string
          read?: boolean | null
          sender_id?: string | null
          sender_name: string
          sender_role?: Database["public"]["Enums"]["message_sender_role"]
        }
        Update: {
          case_id?: string
          content?: string
          created_at?: string
          id?: string
          read?: boolean | null
          sender_id?: string | null
          sender_name?: string
          sender_role?: Database["public"]["Enums"]["message_sender_role"]
        }
        Relationships: [
          {
            foreignKeyName: "case_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_notes: {
        Row: {
          author_id: string | null
          author_name: string
          case_id: string
          content: string
          created_at: string
          id: string
          pinned: boolean | null
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name: string
          case_id: string
          content: string
          created_at?: string
          id?: string
          pinned?: boolean | null
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string
          case_id?: string
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_notes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_participants: {
        Row: {
          case_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_participants_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_timeline: {
        Row: {
          actor_id: string | null
          actor_name: string | null
          case_id: string
          created_at: string
          description: string | null
          event_type: Database["public"]["Enums"]["timeline_event_type"]
          id: string
          title: string
        }
        Insert: {
          actor_id?: string | null
          actor_name?: string | null
          case_id: string
          created_at?: string
          description?: string | null
          event_type?: Database["public"]["Enums"]["timeline_event_type"]
          id?: string
          title: string
        }
        Update: {
          actor_id?: string | null
          actor_name?: string | null
          case_id?: string
          created_at?: string
          description?: string | null
          event_type?: Database["public"]["Enums"]["timeline_event_type"]
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_timeline_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          assigned_to: string | null
          case_number: string
          case_type: string
          consistency_score: number | null
          created_at: string
          created_by: string
          deadline: string | null
          evidence_completion: number | null
          forms_completion: number | null
          id: string
          lock_status: Database["public"]["Enums"]["submission_lock_status"]
          locked_at: string | null
          locked_by: string | null
          notes: string | null
          package_forms: string[] | null
          priority: Database["public"]["Enums"]["case_priority"]
          readiness_score: number | null
          representative: string | null
          status: Database["public"]["Enums"]["case_status"]
          updated_at: string
          visa_type: string | null
          workflow_status: Database["public"]["Enums"]["workflow_status"]
        }
        Insert: {
          assigned_to?: string | null
          case_number: string
          case_type: string
          consistency_score?: number | null
          created_at?: string
          created_by: string
          deadline?: string | null
          evidence_completion?: number | null
          forms_completion?: number | null
          id?: string
          lock_status?: Database["public"]["Enums"]["submission_lock_status"]
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          package_forms?: string[] | null
          priority?: Database["public"]["Enums"]["case_priority"]
          readiness_score?: number | null
          representative?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
          visa_type?: string | null
          workflow_status?: Database["public"]["Enums"]["workflow_status"]
        }
        Update: {
          assigned_to?: string | null
          case_number?: string
          case_type?: string
          consistency_score?: number | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          evidence_completion?: number | null
          forms_completion?: number | null
          id?: string
          lock_status?: Database["public"]["Enums"]["submission_lock_status"]
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          package_forms?: string[] | null
          priority?: Database["public"]["Enums"]["case_priority"]
          readiness_score?: number | null
          representative?: string | null
          status?: Database["public"]["Enums"]["case_status"]
          updated_at?: string
          visa_type?: string | null
          workflow_status?: Database["public"]["Enums"]["workflow_status"]
        }
        Relationships: []
      }
      community_stories: {
        Row: {
          category: string
          created_at: string
          display_name: string | null
          id: string
          is_anonymous: boolean
          is_approved: boolean
          location_approx: string | null
          milestone_type: string | null
          story: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          display_name?: string | null
          id?: string
          is_anonymous?: boolean
          is_approved?: boolean
          location_approx?: string | null
          milestone_type?: string | null
          story: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          display_name?: string | null
          id?: string
          is_anonymous?: boolean
          is_approved?: boolean
          location_approx?: string | null
          milestone_type?: string | null
          story?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      compliance_flags: {
        Row: {
          created_at: string
          flagged_by: string | null
          id: string
          listing_id: string | null
          reason: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
        }
        Insert: {
          created_at?: string
          flagged_by?: string | null
          id?: string
          listing_id?: string | null
          reason: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Update: {
          created_at?: string
          flagged_by?: string | null
          id?: string
          listing_id?: string | null
          reason?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_flags_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      consistency_issues: {
        Row: {
          affected_forms: string[] | null
          case_id: string
          created_at: string
          description: string
          field: string
          id: string
          resolved: boolean | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["consistency_severity"]
        }
        Insert: {
          affected_forms?: string[] | null
          case_id: string
          created_at?: string
          description: string
          field: string
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["consistency_severity"]
        }
        Update: {
          affected_forms?: string[] | null
          case_id?: string
          created_at?: string
          description?: string
          field?: string
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["consistency_severity"]
        }
        Relationships: [
          {
            foreignKeyName: "consistency_issues_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      csv_mapping_templates: {
        Row: {
          category_rules: Json
          column_map: Json
          created_at: string
          filing_type: string
          id: string
          is_default: boolean
          template_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_rules?: Json
          column_map?: Json
          created_at?: string
          filing_type: string
          id?: string
          is_default?: boolean
          template_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_rules?: Json
          column_map?: Json
          created_at?: string
          filing_type?: string
          id?: string
          is_default?: boolean
          template_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          contact_name: string
          country: string | null
          created_at: string
          email: string
          expected_users: number | null
          id: string
          notes: string | null
          organization_name: string
          organization_type: string | null
          phone: string | null
          program_interest: string | null
          role_title: string | null
          scheduled_at: string | null
          status: string
        }
        Insert: {
          contact_name: string
          country?: string | null
          created_at?: string
          email: string
          expected_users?: number | null
          id?: string
          notes?: string | null
          organization_name: string
          organization_type?: string | null
          phone?: string | null
          program_interest?: string | null
          role_title?: string | null
          scheduled_at?: string | null
          status?: string
        }
        Update: {
          contact_name?: string
          country?: string | null
          created_at?: string
          email?: string
          expected_users?: number | null
          id?: string
          notes?: string | null
          organization_name?: string
          organization_type?: string | null
          phone?: string | null
          program_interest?: string | null
          role_title?: string | null
          scheduled_at?: string | null
          status?: string
        }
        Relationships: []
      }
      disclosure_acceptances: {
        Row: {
          accepted_at: string
          disclosure_type: string
          disclosure_version: string
          id: string
          ip_hash: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          disclosure_type: string
          disclosure_version?: string
          id?: string
          ip_hash?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          disclosure_type?: string
          disclosure_version?: string
          id?: string
          ip_hash?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      document_translation_requests: {
        Row: {
          admin_notes: string | null
          assigned_interpreter_id: string | null
          case_id: string | null
          created_at: string | null
          deadline: string | null
          document_title: string
          file_path: string | null
          id: string
          notes: string | null
          price: number | null
          pricing_mode: string | null
          request_type: string
          source_language: string
          status: string
          target_language: string
          translated_file_path: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_interpreter_id?: string | null
          case_id?: string | null
          created_at?: string | null
          deadline?: string | null
          document_title: string
          file_path?: string | null
          id?: string
          notes?: string | null
          price?: number | null
          pricing_mode?: string | null
          request_type?: string
          source_language?: string
          status?: string
          target_language: string
          translated_file_path?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          assigned_interpreter_id?: string | null
          case_id?: string | null
          created_at?: string | null
          deadline?: string | null
          document_title?: string
          file_path?: string | null
          id?: string
          notes?: string | null
          price?: number | null
          pricing_mode?: string | null
          request_type?: string
          source_language?: string
          status?: string
          target_language?: string
          translated_file_path?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_translation_requests_assigned_interpreter_id_fkey"
            columns: ["assigned_interpreter_id"]
            isOneToOne: false
            referencedRelation: "interpreters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_translation_requests_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          case_id: string
          category: string
          created_at: string
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          linked_forms: string[] | null
          name: string
          notes: string | null
          quality: Database["public"]["Enums"]["evidence_quality"] | null
          status: Database["public"]["Enums"]["doc_status"] | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          case_id: string
          category: string
          created_at?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          linked_forms?: string[] | null
          name: string
          notes?: string | null
          quality?: Database["public"]["Enums"]["evidence_quality"] | null
          status?: Database["public"]["Enums"]["doc_status"] | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          case_id?: string
          category?: string
          created_at?: string
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          linked_forms?: string[] | null
          name?: string
          notes?: string | null
          quality?: Database["public"]["Enums"]["evidence_quality"] | null
          status?: Database["public"]["Enums"]["doc_status"] | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      eb5_intakes: {
        Row: {
          attorney_consulted: boolean | null
          business_plan_ready: boolean | null
          created_at: string
          id: string
          investment_amount: number | null
          investment_type: string | null
          job_creation_plan: string | null
          notes: string | null
          risk_acknowledged: boolean | null
          source_of_funds_docs: Json | null
          target_area: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attorney_consulted?: boolean | null
          business_plan_ready?: boolean | null
          created_at?: string
          id?: string
          investment_amount?: number | null
          investment_type?: string | null
          job_creation_plan?: string | null
          notes?: string | null
          risk_acknowledged?: boolean | null
          source_of_funds_docs?: Json | null
          target_area?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attorney_consulted?: boolean | null
          business_plan_ready?: boolean | null
          created_at?: string
          id?: string
          investment_amount?: number | null
          investment_type?: string | null
          job_creation_plan?: string | null
          notes?: string | null
          risk_acknowledged?: boolean | null
          source_of_funds_docs?: Json | null
          target_area?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      employments: {
        Row: {
          address: string | null
          created_at: string
          employer: string
          end_date: string | null
          id: string
          is_current: boolean | null
          job_title: string | null
          person_id: string
          start_date: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          employer: string
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          job_title?: string | null
          person_id: string
          start_date?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          employer?: string
          end_date?: string | null
          id?: string
          is_current?: boolean | null
          job_title?: string | null
          person_id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employments_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      english_certificates: {
        Row: {
          certificate_number: string
          course_id: string
          course_title: string
          id: string
          issued_at: string
          level: Database["public"]["Enums"]["english_level"]
          student_name: string
          user_id: string
        }
        Insert: {
          certificate_number?: string
          course_id: string
          course_title: string
          id?: string
          issued_at?: string
          level: Database["public"]["Enums"]["english_level"]
          student_name: string
          user_id: string
        }
        Update: {
          certificate_number?: string
          course_id?: string
          course_title?: string
          id?: string
          issued_at?: string
          level?: Database["public"]["Enums"]["english_level"]
          student_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "english_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "english_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      english_classes: {
        Row: {
          course_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          jitsi_room_name: string
          notes: string | null
          scheduled_at: string
          status: string
          teacher_id: string
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          jitsi_room_name?: string
          notes?: string | null
          scheduled_at: string
          status?: string
          teacher_id: string
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          jitsi_room_name?: string
          notes?: string | null
          scheduled_at?: string
          status?: string
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "english_classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "english_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "english_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "english_teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      english_courses: {
        Row: {
          category: string
          class_type: Database["public"]["Enums"]["class_type"]
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          level: Database["public"]["Enums"]["english_level"]
          materials_url: string | null
          max_students: number | null
          price: number | null
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          class_type?: Database["public"]["Enums"]["class_type"]
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          level?: Database["public"]["Enums"]["english_level"]
          materials_url?: string | null
          max_students?: number | null
          price?: number | null
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          class_type?: Database["public"]["Enums"]["class_type"]
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          level?: Database["public"]["Enums"]["english_level"]
          materials_url?: string | null
          max_students?: number | null
          price?: number | null
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "english_courses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "english_teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      english_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          status: Database["public"]["Enums"]["enrollment_status"]
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "english_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "english_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      english_enterprise_packages: {
        Row: {
          contact_email: string
          contact_name: string
          created_at: string
          id: string
          notes: string | null
          organization_name: string
          package_type: string
          seats: number
          status: string
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          contact_email: string
          contact_name: string
          created_at?: string
          id?: string
          notes?: string | null
          organization_name: string
          package_type?: string
          seats?: number
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string
          contact_name?: string
          created_at?: string
          id?: string
          notes?: string | null
          organization_name?: string
          package_type?: string
          seats?: number
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      english_lesson_bookings: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          jitsi_room_name: string
          lesson_type: string
          notes: string | null
          scheduled_at: string
          status: string
          stripe_payment_id: string | null
          student_id: string
          teacher_feedback: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          jitsi_room_name?: string
          lesson_type?: string
          notes?: string | null
          scheduled_at: string
          status?: string
          stripe_payment_id?: string | null
          student_id: string
          teacher_feedback?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          jitsi_room_name?: string
          lesson_type?: string
          notes?: string | null
          scheduled_at?: string
          status?: string
          stripe_payment_id?: string | null
          student_id?: string
          teacher_feedback?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "english_lesson_bookings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "english_teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      english_lessons: {
        Row: {
          created_at: string
          description: string | null
          difficulty_level: string | null
          duration_minutes: number | null
          grammar_focus: string | null
          homework_text: string | null
          id: string
          is_active: boolean
          learning_objective: string | null
          lesson_type: Database["public"]["Enums"]["lesson_type"]
          module_id: string
          order_index: number
          slug: string
          speaking_focus: string | null
          title: string
          updated_at: string
          vocabulary_focus: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          grammar_focus?: string | null
          homework_text?: string | null
          id?: string
          is_active?: boolean
          learning_objective?: string | null
          lesson_type?: Database["public"]["Enums"]["lesson_type"]
          module_id: string
          order_index?: number
          slug: string
          speaking_focus?: string | null
          title: string
          updated_at?: string
          vocabulary_focus?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_minutes?: number | null
          grammar_focus?: string | null
          homework_text?: string | null
          id?: string
          is_active?: boolean
          learning_objective?: string | null
          lesson_type?: Database["public"]["Enums"]["lesson_type"]
          module_id?: string
          order_index?: number
          slug?: string
          speaking_focus?: string | null
          title?: string
          updated_at?: string
          vocabulary_focus?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "english_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "english_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      english_levels: {
        Row: {
          certificate_name: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          order_index: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          certificate_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          certificate_name?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          order_index?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      english_modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          learning_goal: string | null
          level_id: string
          order_index: number
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          learning_goal?: string | null
          level_id: string
          order_index?: number
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          learning_goal?: string | null
          level_id?: string
          order_index?: number
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "english_modules_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "english_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      english_placement_results: {
        Row: {
          created_at: string
          grammar_score: number
          id: string
          level: string
          listening_score: number
          recommended_courses: string[] | null
          total_score: number
          user_id: string
          vocab_score: number
          voice_words: number
        }
        Insert: {
          created_at?: string
          grammar_score?: number
          id?: string
          level?: string
          listening_score?: number
          recommended_courses?: string[] | null
          total_score?: number
          user_id: string
          vocab_score?: number
          voice_words?: number
        }
        Update: {
          created_at?: string
          grammar_score?: number
          id?: string
          level?: string
          listening_score?: number
          recommended_courses?: string[] | null
          total_score?: number
          user_id?: string
          vocab_score?: number
          voice_words?: number
        }
        Relationships: []
      }
      english_progress: {
        Row: {
          classes_attended: number | null
          course_id: string
          id: string
          listening_score: number | null
          overall_score: number | null
          placement_level: Database["public"]["Enums"]["english_level"] | null
          reading_score: number | null
          speaking_score: number | null
          total_classes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          classes_attended?: number | null
          course_id: string
          id?: string
          listening_score?: number | null
          overall_score?: number | null
          placement_level?: Database["public"]["Enums"]["english_level"] | null
          reading_score?: number | null
          speaking_score?: number | null
          total_classes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          classes_attended?: number | null
          course_id?: string
          id?: string
          listening_score?: number | null
          overall_score?: number | null
          placement_level?: Database["public"]["Enums"]["english_level"] | null
          reading_score?: number | null
          speaking_score?: number | null
          total_classes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "english_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "english_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      english_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          plan: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
          voice_practices_reset_at: string | null
          voice_practices_today: number | null
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
          voice_practices_reset_at?: string | null
          voice_practices_today?: number | null
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
          voice_practices_reset_at?: string | null
          voice_practices_today?: number | null
        }
        Relationships: []
      }
      english_teacher_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          start_time: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          start_time: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          start_time?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "english_teacher_availability_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "english_teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      english_teachers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          id: string
          is_active: boolean | null
          languages: string[] | null
          specialties: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          specialties?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean | null
          languages?: string[] | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      evidence_links: {
        Row: {
          created_at: string
          document_id: string
          field_key: string | null
          form_instance_id: string | null
          id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          field_key?: string | null
          form_instance_id?: string | null
          id?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          field_key?: string | null
          form_instance_id?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_evidence_form_instance"
            columns: ["form_instance_id"]
            isOneToOne: false
            referencedRelation: "form_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      field_change_logs: {
        Row: {
          after_value: string | null
          audit_event_id: string | null
          before_value: string | null
          created_at: string
          field_name: string
          form_instance_id: string | null
          id: string
          record_id: string
          record_type: string
          user_id: string | null
        }
        Insert: {
          after_value?: string | null
          audit_event_id?: string | null
          before_value?: string | null
          created_at?: string
          field_name: string
          form_instance_id?: string | null
          id?: string
          record_id: string
          record_type: string
          user_id?: string | null
        }
        Update: {
          after_value?: string | null
          audit_event_id?: string | null
          before_value?: string | null
          created_at?: string
          field_name?: string
          form_instance_id?: string | null
          id?: string
          record_id?: string
          record_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "field_change_logs_audit_event_id_fkey"
            columns: ["audit_event_id"]
            isOneToOne: false
            referencedRelation: "audit_events"
            referencedColumns: ["id"]
          },
        ]
      }
      field_values: {
        Row: {
          canonical_path: string | null
          created_at: string
          field_key: string
          field_value: string | null
          form_instance_id: string
          id: string
          populated_from: string | null
          updated_at: string
        }
        Insert: {
          canonical_path?: string | null
          created_at?: string
          field_key: string
          field_value?: string | null
          form_instance_id: string
          id?: string
          populated_from?: string | null
          updated_at?: string
        }
        Update: {
          canonical_path?: string | null
          created_at?: string
          field_key?: string
          field_value?: string | null
          form_instance_id?: string
          id?: string
          populated_from?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_values_form_instance_id_fkey"
            columns: ["form_instance_id"]
            isOneToOne: false
            referencedRelation: "form_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      firm_members: {
        Row: {
          created_at: string | null
          firm_id: string
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["firm_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          firm_id: string
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["firm_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          firm_id?: string
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["firm_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "firm_members_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      form_exports: {
        Row: {
          case_id: string
          created_at: string
          exported_at: string | null
          file_path: string | null
          form_code: string
          id: string
          missing_fields: string[] | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["form_export_status"]
          template_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          exported_at?: string | null
          file_path?: string | null
          form_code: string
          id?: string
          missing_fields?: string[] | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["form_export_status"]
          template_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          exported_at?: string | null
          file_path?: string | null
          form_code?: string
          id?: string
          missing_fields?: string[] | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["form_export_status"]
          template_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_exports_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_exports_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      form_field_mappings: {
        Row: {
          canonical_path: string
          created_at: string
          direction: string | null
          field_key: string
          form_code: string
          id: string
          transform_rule: string | null
        }
        Insert: {
          canonical_path: string
          created_at?: string
          direction?: string | null
          field_key: string
          form_code: string
          id?: string
          transform_rule?: string | null
        }
        Update: {
          canonical_path?: string
          created_at?: string
          direction?: string | null
          field_key?: string
          form_code?: string
          id?: string
          transform_rule?: string | null
        }
        Relationships: []
      }
      form_instances: {
        Row: {
          assigned_to: string | null
          case_id: string
          created_at: string
          form_name: string
          form_type: string
          id: string
          lock_status: Database["public"]["Enums"]["submission_lock_status"]
          locked_at: string | null
          locked_by: string | null
          populated_at: string | null
          progress: number | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          case_id: string
          created_at?: string
          form_name: string
          form_type: string
          id?: string
          lock_status?: Database["public"]["Enums"]["submission_lock_status"]
          locked_at?: string | null
          locked_by?: string | null
          populated_at?: string | null
          progress?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          case_id?: string
          created_at?: string
          form_name?: string
          form_type?: string
          id?: string
          lock_status?: Database["public"]["Enums"]["submission_lock_status"]
          locked_at?: string | null
          locked_by?: string | null
          populated_at?: string | null
          progress?: number | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_instances_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      form_signatures: {
        Row: {
          case_id: string | null
          consent_text: string
          created_at: string
          form_instance_id: string | null
          id: string
          identity_document_id: string | null
          ip_address: string | null
          signature_id: string
          signed_at: string
          signer_email: string | null
          signer_name: string
          signer_role: string
          signer_user_id: string
          user_agent: string | null
        }
        Insert: {
          case_id?: string | null
          consent_text?: string
          created_at?: string
          form_instance_id?: string | null
          id?: string
          identity_document_id?: string | null
          ip_address?: string | null
          signature_id: string
          signed_at?: string
          signer_email?: string | null
          signer_name: string
          signer_role?: string
          signer_user_id: string
          user_agent?: string | null
        }
        Update: {
          case_id?: string | null
          consent_text?: string
          created_at?: string
          form_instance_id?: string | null
          id?: string
          identity_document_id?: string | null
          ip_address?: string | null
          signature_id?: string
          signed_at?: string
          signer_email?: string | null
          signer_name?: string
          signer_role?: string
          signer_user_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_signatures_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_signatures_form_instance_id_fkey"
            columns: ["form_instance_id"]
            isOneToOne: false
            referencedRelation: "form_instances"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_signatures_identity_document_id_fkey"
            columns: ["identity_document_id"]
            isOneToOne: false
            referencedRelation: "identity_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_signatures_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "signatures"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          created_at: string
          edition_date: string | null
          file_path: string
          form_code: string
          form_title: string
          id: string
          is_active: boolean
          mapping_completeness: number
          notes: string | null
          template_version: number
          total_pages: number
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          edition_date?: string | null
          file_path: string
          form_code: string
          form_title: string
          id?: string
          is_active?: boolean
          mapping_completeness?: number
          notes?: string | null
          template_version?: number
          total_pages?: number
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          edition_date?: string | null
          file_path?: string
          form_code?: string
          form_title?: string
          id?: string
          is_active?: boolean
          mapping_completeness?: number
          notes?: string | null
          template_version?: number
          total_pages?: number
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      formation_intakes: {
        Row: {
          additional_data: Json | null
          ai_guidance_log: Json | null
          authorized_shares: number | null
          business_address: string | null
          business_name: string | null
          business_purpose: string | null
          charitable_purpose: string | null
          created_at: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          nonprofit_board: Json | null
          officers: Json | null
          owners: Json | null
          registered_agent_address: string | null
          registered_agent_name: string | null
          state_code: string
          status: Database["public"]["Enums"]["formation_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_data?: Json | null
          ai_guidance_log?: Json | null
          authorized_shares?: number | null
          business_address?: string | null
          business_name?: string | null
          business_purpose?: string | null
          charitable_purpose?: string | null
          created_at?: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          nonprofit_board?: Json | null
          officers?: Json | null
          owners?: Json | null
          registered_agent_address?: string | null
          registered_agent_name?: string | null
          state_code: string
          status?: Database["public"]["Enums"]["formation_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_data?: Json | null
          ai_guidance_log?: Json | null
          authorized_shares?: number | null
          business_address?: string | null
          business_name?: string | null
          business_purpose?: string | null
          charitable_purpose?: string | null
          created_at?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          nonprofit_board?: Json | null
          officers?: Json | null
          owners?: Json | null
          registered_agent_address?: string | null
          registered_agent_name?: string | null
          state_code?: string
          status?: Database["public"]["Enums"]["formation_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "formation_intakes_state_code_fkey"
            columns: ["state_code"]
            isOneToOne: false
            referencedRelation: "us_states"
            referencedColumns: ["code"]
          },
        ]
      }
      identity_documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["id_document_type"]
          extracted_dob: string | null
          extracted_document_number: string | null
          extracted_name: string | null
          file_path: string
          file_path_back: string | null
          id: string
          ocr_raw: Json | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["id_verification_status"]
        }
        Insert: {
          created_at?: string
          document_type: Database["public"]["Enums"]["id_document_type"]
          extracted_dob?: string | null
          extracted_document_number?: string | null
          extracted_name?: string | null
          file_path: string
          file_path_back?: string | null
          id?: string
          ocr_raw?: Json | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["id_verification_status"]
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["id_document_type"]
          extracted_dob?: string | null
          extracted_document_number?: string | null
          extracted_name?: string | null
          file_path?: string
          file_path_back?: string | null
          id?: string
          ocr_raw?: Json | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["id_verification_status"]
        }
        Relationships: []
      }
      immigration_entries: {
        Row: {
          created_at: string
          date_of_entry: string | null
          expiry_date: string | null
          i94_number: string | null
          id: string
          person_id: string
          port_of_entry: string | null
          status: string | null
          visa_type: string | null
        }
        Insert: {
          created_at?: string
          date_of_entry?: string | null
          expiry_date?: string | null
          i94_number?: string | null
          id?: string
          person_id: string
          port_of_entry?: string | null
          status?: string | null
          visa_type?: string | null
        }
        Update: {
          created_at?: string
          date_of_entry?: string | null
          expiry_date?: string | null
          i94_number?: string | null
          id?: string
          person_id?: string
          port_of_entry?: string | null
          status?: string | null
          visa_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "immigration_entries_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immigration_entries_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      immigration_filings: {
        Row: {
          created_at: string
          filing_date: string | null
          form_type: string
          id: string
          person_id: string
          receipt_number: string | null
          result: string | null
        }
        Insert: {
          created_at?: string
          filing_date?: string | null
          form_type: string
          id?: string
          person_id: string
          receipt_number?: string | null
          result?: string | null
        }
        Update: {
          created_at?: string
          filing_date?: string | null
          form_type?: string
          id?: string
          person_id?: string
          receipt_number?: string | null
          result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "immigration_filings_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immigration_filings_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          institution_id: string
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          institution_id: string
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          institution_id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_audit_logs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_participants: {
        Row: {
          assigned_staff_id: string | null
          created_at: string
          documents_required: number | null
          documents_uploaded: number | null
          email: string | null
          first_name: string
          id: string
          institution_id: string
          last_name: string
          next_milestone: string | null
          phone: string | null
          preferred_language: string | null
          program_id: string | null
          readiness_score: number | null
          referral_status: string | null
          service_notes: string | null
          status: Database["public"]["Enums"]["participant_status"]
          tags: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_staff_id?: string | null
          created_at?: string
          documents_required?: number | null
          documents_uploaded?: number | null
          email?: string | null
          first_name: string
          id?: string
          institution_id: string
          last_name: string
          next_milestone?: string | null
          phone?: string | null
          preferred_language?: string | null
          program_id?: string | null
          readiness_score?: number | null
          referral_status?: string | null
          service_notes?: string | null
          status?: Database["public"]["Enums"]["participant_status"]
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_staff_id?: string | null
          created_at?: string
          documents_required?: number | null
          documents_uploaded?: number | null
          email?: string | null
          first_name?: string
          id?: string
          institution_id?: string
          last_name?: string
          next_milestone?: string | null
          phone?: string | null
          preferred_language?: string | null
          program_id?: string | null
          readiness_score?: number | null
          referral_status?: string | null
          service_notes?: string | null
          status?: Database["public"]["Enums"]["participant_status"]
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_participants_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "institution_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_participants_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "institution_participants_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "institution_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_programs: {
        Row: {
          created_at: string
          default_language: string | null
          description: string | null
          id: string
          institution_id: string
          is_active: boolean
          name: string
          program_type: Database["public"]["Enums"]["program_type"]
          updated_at: string
          visible_modules: Json | null
        }
        Insert: {
          created_at?: string
          default_language?: string | null
          description?: string | null
          id?: string
          institution_id: string
          is_active?: boolean
          name: string
          program_type?: Database["public"]["Enums"]["program_type"]
          updated_at?: string
          visible_modules?: Json | null
        }
        Update: {
          created_at?: string
          default_language?: string | null
          description?: string | null
          id?: string
          institution_id?: string
          is_active?: boolean
          name?: string
          program_type?: Database["public"]["Enums"]["program_type"]
          updated_at?: string
          visible_modules?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "institution_programs_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institution_users: {
        Row: {
          created_at: string
          id: string
          institution_id: string
          is_active: boolean
          role: Database["public"]["Enums"]["institutional_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          institution_id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["institutional_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          institution_id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["institutional_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "institution_users_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          address: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          default_language: string
          id: string
          logo_url: string | null
          name: string
          plan_tier: string | null
          state: string | null
          status: Database["public"]["Enums"]["institution_status"]
          type: Database["public"]["Enums"]["institution_type"]
          updated_at: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          default_language?: string
          id?: string
          logo_url?: string | null
          name: string
          plan_tier?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["institution_status"]
          type?: Database["public"]["Enums"]["institution_type"]
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          default_language?: string
          id?: string
          logo_url?: string | null
          name?: string
          plan_tier?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["institution_status"]
          type?: Database["public"]["Enums"]["institution_type"]
          updated_at?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      intake_requests: {
        Row: {
          assigned_to: string | null
          case_id: string | null
          case_type: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          client_user_id: string | null
          created_at: string | null
          firm_id: string | null
          id: string
          notes: string | null
          preferred_language: string | null
          source: string | null
          status: Database["public"]["Enums"]["intake_status"] | null
          updated_at: string | null
          urgency: string | null
        }
        Insert: {
          assigned_to?: string | null
          case_id?: string | null
          case_type?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          client_user_id?: string | null
          created_at?: string | null
          firm_id?: string | null
          id?: string
          notes?: string | null
          preferred_language?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["intake_status"] | null
          updated_at?: string | null
          urgency?: string | null
        }
        Update: {
          assigned_to?: string | null
          case_id?: string | null
          case_type?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          client_user_id?: string | null
          created_at?: string | null
          firm_id?: string | null
          id?: string
          notes?: string | null
          preferred_language?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["intake_status"] | null
          updated_at?: string | null
          urgency?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intake_requests_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intake_requests_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      interpreter_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          interpreter_id: string
          is_active: boolean | null
          start_time: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          interpreter_id: string
          is_active?: boolean | null
          start_time: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          interpreter_id?: string
          is_active?: boolean | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "interpreter_availability_interpreter_id_fkey"
            columns: ["interpreter_id"]
            isOneToOne: false
            referencedRelation: "interpreters"
            referencedColumns: ["id"]
          },
        ]
      }
      interpreter_blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string | null
          id: string
          interpreter_id: string
          reason: string | null
        }
        Insert: {
          blocked_date: string
          created_at?: string | null
          id?: string
          interpreter_id: string
          reason?: string | null
        }
        Update: {
          blocked_date?: string
          created_at?: string | null
          id?: string
          interpreter_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interpreter_blocked_dates_interpreter_id_fkey"
            columns: ["interpreter_id"]
            isOneToOne: false
            referencedRelation: "interpreters"
            referencedColumns: ["id"]
          },
        ]
      }
      interpreter_bookings: {
        Row: {
          case_id: string | null
          created_at: string | null
          duration_minutes: number
          id: string
          interpreter_id: string
          language_pair: string
          meeting_link: string | null
          meeting_type: string | null
          notes: string | null
          request_id: string | null
          scheduled_at: string
          status: string
          support_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          interpreter_id: string
          language_pair: string
          meeting_link?: string | null
          meeting_type?: string | null
          notes?: string | null
          request_id?: string | null
          scheduled_at: string
          status?: string
          support_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          case_id?: string | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          interpreter_id?: string
          language_pair?: string
          meeting_link?: string | null
          meeting_type?: string | null
          notes?: string | null
          request_id?: string | null
          scheduled_at?: string
          status?: string
          support_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interpreter_bookings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpreter_bookings_interpreter_id_fkey"
            columns: ["interpreter_id"]
            isOneToOne: false
            referencedRelation: "interpreters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpreter_bookings_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "language_support_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      interpreter_session_notes: {
        Row: {
          booking_id: string
          created_at: string | null
          duration_actual: number | null
          follow_up_recommended: boolean | null
          id: string
          interpreter_id: string
          language_pair: string | null
          note: string | null
          support_type: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          duration_actual?: number | null
          follow_up_recommended?: boolean | null
          id?: string
          interpreter_id: string
          language_pair?: string | null
          note?: string | null
          support_type?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          duration_actual?: number | null
          follow_up_recommended?: boolean | null
          id?: string
          interpreter_id?: string
          language_pair?: string | null
          note?: string | null
          support_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interpreter_session_notes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "interpreter_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interpreter_session_notes_interpreter_id_fkey"
            columns: ["interpreter_id"]
            isOneToOne: false
            referencedRelation: "interpreters"
            referencedColumns: ["id"]
          },
        ]
      }
      interpreter_session_ratings: {
        Row: {
          booking_id: string
          communication_clarity: number | null
          created_at: string | null
          feedback: string | null
          id: string
          language_accuracy: number | null
          overall_rating: number | null
          professionalism: number | null
          usefulness: number | null
          user_id: string
        }
        Insert: {
          booking_id: string
          communication_clarity?: number | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          language_accuracy?: number | null
          overall_rating?: number | null
          professionalism?: number | null
          usefulness?: number | null
          user_id: string
        }
        Update: {
          booking_id?: string
          communication_clarity?: number | null
          created_at?: string | null
          feedback?: string | null
          id?: string
          language_accuracy?: number | null
          overall_rating?: number | null
          professionalism?: number | null
          usefulness?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interpreter_session_ratings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "interpreter_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      interpreters: {
        Row: {
          avatar_url: string | null
          bio: string | null
          certifications: string | null
          created_at: string | null
          email: string | null
          full_name: string
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          is_internal: boolean | null
          languages: string[]
          organization_affiliation: string | null
          phone: string | null
          role: string
          specialties: string[] | null
          timezone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          certifications?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          is_internal?: boolean | null
          languages?: string[]
          organization_affiliation?: string | null
          phone?: string | null
          role?: string
          specialties?: string[] | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          certifications?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          is_internal?: boolean | null
          languages?: string[]
          organization_affiliation?: string | null
          phone?: string | null
          role?: string
          specialties?: string[] | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      investor_leads: {
        Row: {
          accredited_investor_ack: boolean | null
          created_at: string
          email: string
          id: string
          listing_id: string | null
          message: string | null
          name: string
          risk_ack: boolean | null
          user_id: string | null
        }
        Insert: {
          accredited_investor_ack?: boolean | null
          created_at?: string
          email: string
          id?: string
          listing_id?: string | null
          message?: string | null
          name: string
          risk_ack?: boolean | null
          user_id?: string | null
        }
        Update: {
          accredited_investor_ack?: boolean | null
          created_at?: string
          email?: string
          id?: string
          listing_id?: string | null
          message?: string | null
          name?: string
          risk_ack?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_leads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      irs_integration_settings: {
        Row: {
          api_label: string
          created_at: string
          environment: string
          id: string
          integration_type: string
          jwks_json: Json | null
          last_updated_by: string | null
          notes: string | null
          redirect_url: string | null
          selected_apis: string[]
          status: string
          updated_at: string
          validated_at: string | null
        }
        Insert: {
          api_label?: string
          created_at?: string
          environment?: string
          id?: string
          integration_type?: string
          jwks_json?: Json | null
          last_updated_by?: string | null
          notes?: string | null
          redirect_url?: string | null
          selected_apis?: string[]
          status?: string
          updated_at?: string
          validated_at?: string | null
        }
        Update: {
          api_label?: string
          created_at?: string
          environment?: string
          id?: string
          integration_type?: string
          jwks_json?: Json | null
          last_updated_by?: string | null
          notes?: string | null
          redirect_url?: string | null
          selected_apis?: string[]
          status?: string
          updated_at?: string
          validated_at?: string | null
        }
        Relationships: []
      }
      language_support_requests: {
        Row: {
          admin_notes: string | null
          assigned_interpreter_id: string | null
          case_id: string | null
          created_at: string | null
          description: string | null
          id: string
          meeting_type: string | null
          preferred_date: string | null
          preferred_language: string
          preferred_time: string | null
          price: number | null
          pricing_mode: string | null
          secondary_language: string | null
          status: string
          support_type: string
          updated_at: string | null
          urgency: string
          user_id: string
          user_role: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_interpreter_id?: string | null
          case_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          meeting_type?: string | null
          preferred_date?: string | null
          preferred_language?: string
          preferred_time?: string | null
          price?: number | null
          pricing_mode?: string | null
          secondary_language?: string | null
          status?: string
          support_type?: string
          updated_at?: string | null
          urgency?: string
          user_id: string
          user_role?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_interpreter_id?: string | null
          case_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          meeting_type?: string | null
          preferred_date?: string | null
          preferred_language?: string
          preferred_time?: string | null
          price?: number | null
          pricing_mode?: string | null
          secondary_language?: string | null
          status?: string
          support_type?: string
          updated_at?: string | null
          urgency?: string
          user_id?: string
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "language_support_requests_assigned_interpreter_id_fkey"
            columns: ["assigned_interpreter_id"]
            isOneToOne: false
            referencedRelation: "interpreters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "language_support_requests_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      law_firms: {
        Row: {
          address: string | null
          created_at: string | null
          created_by: string
          email: string | null
          id: string
          languages: string[] | null
          logo_url: string | null
          name: string
          phone: string | null
          practice_areas: string[] | null
          subscription_status: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          created_by: string
          email?: string | null
          id?: string
          languages?: string[] | null
          logo_url?: string | null
          name: string
          phone?: string | null
          practice_areas?: string[] | null
          subscription_status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          created_by?: string
          email?: string | null
          id?: string
          languages?: string[] | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          practice_areas?: string[] | null
          subscription_status?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      lesson_dialogues: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          line_text: string
          order_index: number
          speaker_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          line_text: string
          order_index?: number
          speaker_name: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          line_text?: string
          order_index?: number
          speaker_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_dialogues_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "english_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_homework_items: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          order_index: number
          submission_type: Database["public"]["Enums"]["submission_type"]
          task_description: string | null
          task_title: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          order_index?: number
          submission_type?: Database["public"]["Enums"]["submission_type"]
          task_description?: string | null
          task_title: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          order_index?: number
          submission_type?: Database["public"]["Enums"]["submission_type"]
          task_description?: string | null
          task_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_homework_items_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "english_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string
          explanation: string | null
          id: string
          lesson_id: string
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          order_index: number
          prompt: string
          question_type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          correct_answer: string
          created_at?: string
          explanation?: string | null
          id?: string
          lesson_id: string
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          order_index?: number
          prompt: string
          question_type?: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          correct_answer?: string
          created_at?: string
          explanation?: string | null
          id?: string
          lesson_id?: string
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          order_index?: number
          prompt?: string
          question_type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "lesson_quiz_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "english_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_sections: {
        Row: {
          content: string | null
          created_at: string
          id: string
          lesson_id: string
          order_index: number
          section_type: Database["public"]["Enums"]["section_type"]
          title: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          order_index?: number
          section_type: Database["public"]["Enums"]["section_type"]
          title?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          order_index?: number
          section_type?: Database["public"]["Enums"]["section_type"]
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_sections_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "english_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_vocab_items: {
        Row: {
          created_at: string
          definition: string | null
          example_sentence: string | null
          id: string
          lesson_id: string
          order_index: number
          pronunciation_hint: string | null
          word: string
        }
        Insert: {
          created_at?: string
          definition?: string | null
          example_sentence?: string | null
          id?: string
          lesson_id: string
          order_index?: number
          pronunciation_hint?: string | null
          word: string
        }
        Update: {
          created_at?: string
          definition?: string | null
          example_sentence?: string | null
          id?: string
          lesson_id?: string
          order_index?: number
          pronunciation_hint?: string | null
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_vocab_items_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "english_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_voice_prompts: {
        Row: {
          created_at: string
          feedback_hint: string | null
          id: string
          lesson_id: string
          order_index: number
          prompt_text: string
          prompt_title: string | null
          sample_answer: string | null
        }
        Insert: {
          created_at?: string
          feedback_hint?: string | null
          id?: string
          lesson_id: string
          order_index?: number
          prompt_text: string
          prompt_title?: string | null
          sample_answer?: string | null
        }
        Update: {
          created_at?: string
          feedback_hint?: string | null
          id?: string
          lesson_id?: string
          order_index?: number
          prompt_text?: string
          prompt_title?: string | null
          sample_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_voice_prompts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "english_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          listing_id: string | null
          status: string
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          listing_id?: string | null
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          listing_id?: string | null
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_subscriptions_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      message_translations: {
        Row: {
          created_at: string
          id: string
          message_id: string
          simple_explanation: string | null
          source_language: string
          target_language: string
          translated_text: string
          translation_method: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          simple_explanation?: string | null
          source_language?: string
          target_language: string
          translated_text: string
          translation_method?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          simple_explanation?: string | null
          source_language?: string
          target_language?: string
          translated_text?: string
          translation_method?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_translations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "case_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      network_listings: {
        Row: {
          admin_notes: string | null
          application_link: string | null
          category: Database["public"]["Enums"]["network_listing_category"]
          contact_method: string | null
          country: string | null
          created_at: string
          credentials: string | null
          disclaimer_accepted: boolean
          expires_at: string | null
          id: string
          is_featured: boolean
          is_verified: boolean
          location: string | null
          organization_name: string
          professional_type:
            | Database["public"]["Enums"]["professional_type"]
            | null
          published_at: string | null
          requirements: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          salary_range: string | null
          services_offered: string[] | null
          sponsorship_type: string | null
          state: string | null
          status: Database["public"]["Enums"]["network_listing_status"]
          summary: string
          title: string
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          application_link?: string | null
          category: Database["public"]["Enums"]["network_listing_category"]
          contact_method?: string | null
          country?: string | null
          created_at?: string
          credentials?: string | null
          disclaimer_accepted?: boolean
          expires_at?: string | null
          id?: string
          is_featured?: boolean
          is_verified?: boolean
          location?: string | null
          organization_name: string
          professional_type?:
            | Database["public"]["Enums"]["professional_type"]
            | null
          published_at?: string | null
          requirements?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salary_range?: string | null
          services_offered?: string[] | null
          sponsorship_type?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["network_listing_status"]
          summary: string
          title: string
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          application_link?: string | null
          category?: Database["public"]["Enums"]["network_listing_category"]
          contact_method?: string | null
          country?: string | null
          created_at?: string
          credentials?: string | null
          disclaimer_accepted?: boolean
          expires_at?: string | null
          id?: string
          is_featured?: boolean
          is_verified?: boolean
          location?: string | null
          organization_name?: string
          professional_type?:
            | Database["public"]["Enums"]["professional_type"]
            | null
          published_at?: string | null
          requirements?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          salary_range?: string | null
          services_offered?: string[] | null
          sponsorship_type?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["network_listing_status"]
          summary?: string
          title?: string
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      nonprofit_intakes: {
        Row: {
          board_members: Json | null
          bylaws_drafted: boolean | null
          charitable_registration_states: Json | null
          conflict_of_interest_policy: boolean | null
          created_at: string
          ein_status: string | null
          form_1023_type: string | null
          formation_intake_id: string | null
          id: string
          irs_submission_ready: boolean | null
          notes: string | null
          organizing_docs_ready: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          board_members?: Json | null
          bylaws_drafted?: boolean | null
          charitable_registration_states?: Json | null
          conflict_of_interest_policy?: boolean | null
          created_at?: string
          ein_status?: string | null
          form_1023_type?: string | null
          formation_intake_id?: string | null
          id?: string
          irs_submission_ready?: boolean | null
          notes?: string | null
          organizing_docs_ready?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          board_members?: Json | null
          bylaws_drafted?: boolean | null
          charitable_registration_states?: Json | null
          conflict_of_interest_policy?: boolean | null
          created_at?: string
          ein_status?: string | null
          form_1023_type?: string | null
          formation_intake_id?: string | null
          id?: string
          irs_submission_ready?: boolean | null
          notes?: string | null
          organizing_docs_ready?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nonprofit_intakes_formation_intake_id_fkey"
            columns: ["formation_intake_id"]
            isOneToOne: false
            referencedRelation: "formation_intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          case_id: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          case_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          case_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      participant_timeline: {
        Row: {
          actor_id: string | null
          created_at: string
          description: string | null
          event_type: string
          id: string
          participant_id: string
          title: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          participant_id: string
          title: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          participant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_timeline_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "institution_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      partnership_leads: {
        Row: {
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          id: string
          interest_area: string | null
          message: string | null
          organization_name: string
          organization_type: string | null
          status: string
        }
        Insert: {
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          interest_area?: string | null
          message?: string | null
          organization_name: string
          organization_type?: string | null
          status?: string
        }
        Update: {
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          interest_area?: string | null
          message?: string | null
          organization_name?: string
          organization_type?: string | null
          status?: string
        }
        Relationships: []
      }
      pathway_answers: {
        Row: {
          answer_value: Json | null
          confidence: number | null
          created_at: string
          id: string
          question_id: string
          session_id: string
          source: string
        }
        Insert: {
          answer_value?: Json | null
          confidence?: number | null
          created_at?: string
          id?: string
          question_id: string
          session_id: string
          source?: string
        }
        Update: {
          answer_value?: Json | null
          confidence?: number | null
          created_at?: string
          id?: string
          question_id?: string
          session_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "pathway_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pathway_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pathway_evidence_templates: {
        Row: {
          created_at: string
          examples: Json | null
          explain_plain: string | null
          id: string
          label: string
          pathway_id: string
          required: boolean
          requirement_key: string
        }
        Insert: {
          created_at?: string
          examples?: Json | null
          explain_plain?: string | null
          id?: string
          label: string
          pathway_id: string
          required?: boolean
          requirement_key: string
        }
        Update: {
          created_at?: string
          examples?: Json | null
          explain_plain?: string | null
          id?: string
          label?: string
          pathway_id?: string
          required?: boolean
          requirement_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "pathway_evidence_templates_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      pathway_forms: {
        Row: {
          created_at: string
          form_code: string
          id: string
          notes: string | null
          pathway_id: string
          required: boolean
        }
        Insert: {
          created_at?: string
          form_code: string
          id?: string
          notes?: string | null
          pathway_id: string
          required?: boolean
        }
        Update: {
          created_at?: string
          form_code?: string
          id?: string
          notes?: string | null
          pathway_id?: string
          required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pathway_forms_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      pathway_results: {
        Row: {
          generated_at: string
          id: string
          missing_questions: Json | null
          pathway_id: string
          reasons: Json | null
          risk_flags: Json | null
          score: number
          session_id: string
          status: Database["public"]["Enums"]["pathway_result_status"]
        }
        Insert: {
          generated_at?: string
          id?: string
          missing_questions?: Json | null
          pathway_id: string
          reasons?: Json | null
          risk_flags?: Json | null
          score?: number
          session_id: string
          status?: Database["public"]["Enums"]["pathway_result_status"]
        }
        Update: {
          generated_at?: string
          id?: string
          missing_questions?: Json | null
          pathway_id?: string
          reasons?: Json | null
          risk_flags?: Json | null
          score?: number
          session_id?: string
          status?: Database["public"]["Enums"]["pathway_result_status"]
        }
        Relationships: [
          {
            foreignKeyName: "pathway_results_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pathway_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pathway_roadmap_templates: {
        Row: {
          created_at: string
          description_plain: string | null
          documents_expected: Json | null
          estimated_time_band: Json | null
          id: string
          pathway_id: string
          step_key: string
          step_order: number
          title: string
          trigger: string | null
        }
        Insert: {
          created_at?: string
          description_plain?: string | null
          documents_expected?: Json | null
          estimated_time_band?: Json | null
          id?: string
          pathway_id: string
          step_key: string
          step_order: number
          title: string
          trigger?: string | null
        }
        Update: {
          created_at?: string
          description_plain?: string | null
          documents_expected?: Json | null
          estimated_time_band?: Json | null
          id?: string
          pathway_id?: string
          step_key?: string
          step_order?: number
          title?: string
          trigger?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pathway_roadmap_templates_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      pathway_rule_audit: {
        Row: {
          created_at: string
          explanation_returned: string | null
          id: string
          inputs_used: Json | null
          pathway_id: string
          rule_fired: boolean
          rule_id: string
          session_id: string
        }
        Insert: {
          created_at?: string
          explanation_returned?: string | null
          id?: string
          inputs_used?: Json | null
          pathway_id: string
          rule_fired?: boolean
          rule_id: string
          session_id: string
        }
        Update: {
          created_at?: string
          explanation_returned?: string | null
          id?: string
          inputs_used?: Json | null
          pathway_id?: string
          rule_fired?: boolean
          rule_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pathway_rule_audit_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_rule_audit_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "pathway_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_rule_audit_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "pathway_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      pathway_rules: {
        Row: {
          created_at: string
          explain_if_false: string | null
          explain_if_true: string | null
          expr: Json
          id: string
          pathway_id: string
          rule_id: string | null
          rule_type: Database["public"]["Enums"]["pathway_rule_type"]
          weight: number
        }
        Insert: {
          created_at?: string
          explain_if_false?: string | null
          explain_if_true?: string | null
          expr: Json
          id?: string
          pathway_id: string
          rule_id?: string | null
          rule_type?: Database["public"]["Enums"]["pathway_rule_type"]
          weight?: number
        }
        Update: {
          created_at?: string
          explain_if_false?: string | null
          explain_if_true?: string | null
          expr?: Json
          id?: string
          pathway_id?: string
          rule_id?: string | null
          rule_type?: Database["public"]["Enums"]["pathway_rule_type"]
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "pathway_rules_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      pathway_sessions: {
        Row: {
          country_of_residence: string | null
          created_at: string
          disclaimer_ack: boolean
          id: string
          locale: string
          started_at: string
          status: Database["public"]["Enums"]["pathway_session_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          country_of_residence?: string | null
          created_at?: string
          disclaimer_ack?: boolean
          id?: string
          locale?: string
          started_at?: string
          status?: Database["public"]["Enums"]["pathway_session_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          country_of_residence?: string | null
          created_at?: string
          disclaimer_ack?: boolean
          id?: string
          locale?: string
          started_at?: string
          status?: Database["public"]["Enums"]["pathway_session_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pathways: {
        Row: {
          category: Database["public"]["Enums"]["pathway_category"]
          created_at: string
          description_plain: string | null
          display_name: string
          id: string
          requires_rep_review: boolean
          risk_level_default: Database["public"]["Enums"]["pathway_risk_level"]
        }
        Insert: {
          category: Database["public"]["Enums"]["pathway_category"]
          created_at?: string
          description_plain?: string | null
          display_name: string
          id: string
          requires_rep_review?: boolean
          risk_level_default?: Database["public"]["Enums"]["pathway_risk_level"]
        }
        Update: {
          category?: Database["public"]["Enums"]["pathway_category"]
          created_at?: string
          description_plain?: string | null
          display_name?: string
          id?: string
          requires_rep_review?: boolean
          risk_level_default?: Database["public"]["Enums"]["pathway_risk_level"]
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          case_id: string
          created_at: string
          description: string
          due_date: string | null
          id: string
          paid_date: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_payment_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          case_id: string
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          paid_date?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          case_id?: string
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          paid_date?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_payment_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      person_identity: {
        Row: {
          alien_number: string | null
          country_of_birth: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string
          id: string
          last_name: string
          nationality: string | null
          person_id: string
          relationship: string
        }
        Insert: {
          alien_number?: string | null
          country_of_birth?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name: string
          id?: string
          last_name: string
          nationality?: string | null
          person_id: string
          relationship: string
        }
        Update: {
          alien_number?: string | null
          country_of_birth?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          id?: string
          last_name?: string
          nationality?: string | null
          person_id?: string
          relationship?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_identity_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_identity_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      persons: {
        Row: {
          alien_number: string | null
          case_id: string
          city_of_birth: string | null
          country_of_birth: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          marital_status: string | null
          middle_name: string | null
          nationality: string | null
          other_names: string[] | null
          passport_country: string | null
          passport_expiry: string | null
          passport_number: string | null
          phone: string | null
          role: Database["public"]["Enums"]["person_role"]
          ssn: string | null
          updated_at: string
        }
        Insert: {
          alien_number?: string | null
          case_id: string
          city_of_birth?: string | null
          country_of_birth?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          marital_status?: string | null
          middle_name?: string | null
          nationality?: string | null
          other_names?: string[] | null
          passport_country?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["person_role"]
          ssn?: string | null
          updated_at?: string
        }
        Update: {
          alien_number?: string | null
          case_id?: string
          city_of_birth?: string | null
          country_of_birth?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          marital_status?: string | null
          middle_name?: string | null
          nationality?: string | null
          other_names?: string[] | null
          passport_country?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["person_role"]
          ssn?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "persons_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_applications: {
        Row: {
          clients_served_annually: number | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          id: string
          location: string | null
          notes: string | null
          organization_name: string
          organization_type: string | null
          program_type: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          clients_served_annually?: number | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          organization_name: string
          organization_type?: string | null
          program_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          clients_served_annually?: number | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          organization_name?: string
          organization_type?: string | null
          program_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      platform_errors: {
        Row: {
          case_id: string | null
          created_at: string
          details: Json | null
          error_type: string
          id: string
          message: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          route: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          details?: Json | null
          error_type: string
          id?: string
          message: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          route?: string | null
          severity?: string
          user_id?: string | null
        }
        Update: {
          case_id?: string | null
          created_at?: string
          details?: Json | null
          error_type?: string
          id?: string
          message?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          route?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_errors_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      product_pricing: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          price_cents: number
          product_key: string
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean
          price_cents?: number
          product_key: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          price_cents?: number
          product_key?: string
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      professional_handoffs: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          handoff_type: Database["public"]["Enums"]["handoff_type"]
          id: string
          message: string | null
          preferred_contact: string | null
          related_intake_id: string | null
          related_intake_type: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          handoff_type: Database["public"]["Enums"]["handoff_type"]
          id?: string
          message?: string | null
          preferred_contact?: string | null
          related_intake_id?: string | null
          related_intake_type?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          handoff_type?: Database["public"]["Enums"]["handoff_type"]
          id?: string
          message?: string | null
          preferred_contact?: string | null
          related_intake_id?: string | null
          related_intake_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      professional_verifications: {
        Row: {
          admin_notes: string | null
          created_at: string
          document_type: string
          expiration_date: string | null
          file_name: string | null
          file_path: string | null
          id: string
          issued_date: string | null
          issuing_authority: string | null
          license_number: string | null
          renewal_date: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          document_type: string
          expiration_date?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          issued_date?: string | null
          issuing_authority?: string | null
          license_number?: string | null
          renewal_date?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          document_type?: string
          expiration_date?: string | null
          file_name?: string | null
          file_path?: string | null
          id?: string
          issued_date?: string | null
          issuing_authority?: string | null
          license_number?: string | null
          renewal_date?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email: string | null
          first_name: string | null
          foreign_address: string | null
          foreign_city: string | null
          foreign_country: string | null
          home_address: string | null
          home_city: string | null
          home_country: string | null
          home_state: string | null
          home_zip: string | null
          id: string
          last_name: string | null
          phone: string | null
          preferred_language: string
          secondary_language: string | null
          translation_enabled: boolean
          tts_enabled: boolean
          updated_at: string
          user_id: string
          voice_input_enabled: boolean
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          foreign_address?: string | null
          foreign_city?: string | null
          foreign_country?: string | null
          home_address?: string | null
          home_city?: string | null
          home_country?: string | null
          home_state?: string | null
          home_zip?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          preferred_language?: string
          secondary_language?: string | null
          translation_enabled?: boolean
          tts_enabled?: boolean
          updated_at?: string
          user_id: string
          voice_input_enabled?: boolean
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          foreign_address?: string | null
          foreign_city?: string | null
          foreign_country?: string | null
          home_address?: string | null
          home_city?: string | null
          home_country?: string | null
          home_state?: string | null
          home_zip?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          preferred_language?: string
          secondary_language?: string | null
          translation_enabled?: boolean
          tts_enabled?: boolean
          updated_at?: string
          user_id?: string
          voice_input_enabled?: boolean
        }
        Relationships: []
      }
      program_reports: {
        Row: {
          created_at: string
          generated_by: string | null
          id: string
          institution_id: string
          metrics: Json | null
          period_end: string
          period_start: string
          program_id: string | null
          report_type: string
        }
        Insert: {
          created_at?: string
          generated_by?: string | null
          id?: string
          institution_id: string
          metrics?: Json | null
          period_end: string
          period_start: string
          program_id?: string | null
          report_type?: string
        }
        Update: {
          created_at?: string
          generated_by?: string | null
          id?: string
          institution_id?: string
          metrics?: Json | null
          period_end?: string
          period_start?: string
          program_id?: string | null
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_reports_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_reports_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "institution_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      question_logic: {
        Row: {
          condition_expr: Json
          created_at: string
          id: string
          priority: number
          question_id: string
          stop_rule: string | null
        }
        Insert: {
          condition_expr: Json
          created_at?: string
          id?: string
          priority?: number
          question_id: string
          stop_rule?: string | null
        }
        Update: {
          condition_expr?: Json
          created_at?: string
          id?: string
          priority?: number
          question_id?: string
          stop_rule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_logic_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer_type: string
          choice_translations: Json | null
          choices: Json | null
          created_at: string
          examples: Json | null
          followups: Json | null
          help_plain: string | null
          help_translations: Json | null
          id: string
          logic: Json | null
          priority: number | null
          prompt_official: string | null
          prompt_plain: string
          prompt_translations: Json | null
          title: string
        }
        Insert: {
          answer_type: string
          choice_translations?: Json | null
          choices?: Json | null
          created_at?: string
          examples?: Json | null
          followups?: Json | null
          help_plain?: string | null
          help_translations?: Json | null
          id: string
          logic?: Json | null
          priority?: number | null
          prompt_official?: string | null
          prompt_plain: string
          prompt_translations?: Json | null
          title: string
        }
        Update: {
          answer_type?: string
          choice_translations?: Json | null
          choices?: Json | null
          created_at?: string
          examples?: Json | null
          followups?: Json | null
          help_plain?: string | null
          help_translations?: Json | null
          id?: string
          logic?: Json | null
          priority?: number | null
          prompt_official?: string | null
          prompt_plain?: string
          prompt_translations?: Json | null
          title?: string
        }
        Relationships: []
      }
      readiness_scores: {
        Row: {
          blockers: string[] | null
          calculated_at: string
          case_id: string
          consistency_score: number
          evidence_score: number
          forms_score: number
          id: string
          total_score: number
        }
        Insert: {
          blockers?: string[] | null
          calculated_at?: string
          case_id: string
          consistency_score: number
          evidence_score: number
          forms_score: number
          id?: string
          total_score: number
        }
        Update: {
          blockers?: string[] | null
          calculated_at?: string
          case_id?: string
          consistency_score?: number
          evidence_score?: number
          forms_score?: number
          id?: string
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "readiness_scores_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      record_versions: {
        Row: {
          after_values: Json | null
          audit_event_id: string | null
          before_values: Json | null
          created_at: string
          fields_changed: string[] | null
          id: string
          is_current: boolean
          metadata: Json | null
          record_id: string
          record_type: string
          snapshot: Json
          user_id: string | null
          version_number: number
        }
        Insert: {
          after_values?: Json | null
          audit_event_id?: string | null
          before_values?: Json | null
          created_at?: string
          fields_changed?: string[] | null
          id?: string
          is_current?: boolean
          metadata?: Json | null
          record_id: string
          record_type: string
          snapshot: Json
          user_id?: string | null
          version_number?: number
        }
        Update: {
          after_values?: Json | null
          audit_event_id?: string | null
          before_values?: Json | null
          created_at?: string
          fields_changed?: string[] | null
          id?: string
          is_current?: boolean
          metadata?: Json | null
          record_id?: string
          record_type?: string
          snapshot?: Json
          user_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "record_versions_audit_event_id_fkey"
            columns: ["audit_event_id"]
            isOneToOne: false
            referencedRelation: "audit_events"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_events: {
        Row: {
          case_id: string | null
          created_at: string
          event_type: string
          form_instance_id: string | null
          id: string
          identity_document_id: string | null
          metadata: Json | null
          signature_id: string | null
          user_id: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          event_type: string
          form_instance_id?: string | null
          id?: string
          identity_document_id?: string | null
          metadata?: Json | null
          signature_id?: string | null
          user_id: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          event_type?: string
          form_instance_id?: string | null
          id?: string
          identity_document_id?: string | null
          metadata?: Json | null
          signature_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      signatures: {
        Row: {
          created_at: string
          file_path: string | null
          font_style: string | null
          id: string
          is_default: boolean | null
          method: Database["public"]["Enums"]["signature_method"]
          signature_data: string
          typed_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          font_style?: string | null
          id?: string
          is_default?: boolean | null
          method: Database["public"]["Enums"]["signature_method"]
          signature_data: string
          typed_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string | null
          font_style?: string | null
          id?: string
          is_default?: boolean | null
          method?: Database["public"]["Enums"]["signature_method"]
          signature_data?: string
          typed_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      student_lesson_progress: {
        Row: {
          completed_at: string | null
          completion_percent: number | null
          created_at: string
          homework_completed: boolean | null
          id: string
          lesson_id: string
          quiz_score: number | null
          status: Database["public"]["Enums"]["lesson_progress_status"]
          updated_at: string
          user_id: string
          voice_practice_completed: boolean | null
        }
        Insert: {
          completed_at?: string | null
          completion_percent?: number | null
          created_at?: string
          homework_completed?: boolean | null
          id?: string
          lesson_id: string
          quiz_score?: number | null
          status?: Database["public"]["Enums"]["lesson_progress_status"]
          updated_at?: string
          user_id: string
          voice_practice_completed?: boolean | null
        }
        Update: {
          completed_at?: string | null
          completion_percent?: number | null
          created_at?: string
          homework_completed?: boolean | null
          id?: string
          lesson_id?: string
          quiz_score?: number | null
          status?: Database["public"]["Enums"]["lesson_progress_status"]
          updated_at?: string
          user_id?: string
          voice_practice_completed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "student_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "english_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      student_level_progress: {
        Row: {
          certificate_eligible: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          lessons_completed: number | null
          level_id: string
          quizzes_average: number | null
          speaking_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_eligible?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lessons_completed?: number | null
          level_id: string
          quizzes_average?: number | null
          speaking_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_eligible?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lessons_completed?: number | null
          level_id?: string
          quizzes_average?: number | null
          speaking_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_level_progress_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "english_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      success_map_entries: {
        Row: {
          case_type: string
          created_at: string
          id: string
          is_approved: boolean
          latitude: number | null
          location_label: string | null
          longitude: number | null
          milestone: string
          timeline_months: number | null
          user_id: string
        }
        Insert: {
          case_type: string
          created_at?: string
          id?: string
          is_approved?: boolean
          latitude?: number | null
          location_label?: string | null
          longitude?: number | null
          milestone: string
          timeline_months?: number | null
          user_id: string
        }
        Update: {
          case_type?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          latitude?: number | null
          location_label?: string | null
          longitude?: number | null
          milestone?: string
          timeline_months?: number | null
          user_id?: string
        }
        Relationships: []
      }
      tax_ai_events: {
        Row: {
          created_at: string
          decision: string | null
          event_type: string
          field_key: string | null
          id: string
          metadata: Json
          suggested_value: string | null
          tax_ai_session_id: string
        }
        Insert: {
          created_at?: string
          decision?: string | null
          event_type: string
          field_key?: string | null
          id?: string
          metadata?: Json
          suggested_value?: string | null
          tax_ai_session_id: string
        }
        Update: {
          created_at?: string
          decision?: string | null
          event_type?: string
          field_key?: string | null
          id?: string
          metadata?: Json
          suggested_value?: string | null
          tax_ai_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_ai_events_tax_ai_session_id_fkey"
            columns: ["tax_ai_session_id"]
            isOneToOne: false
            referencedRelation: "tax_ai_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_ai_sessions: {
        Row: {
          created_at: string
          current_context: Json
          ended_at: string | null
          id: string
          mode: string
          started_at: string
          tax_file_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          current_context?: Json
          ended_at?: string | null
          id?: string
          mode?: string
          started_at?: string
          tax_file_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          current_context?: Json
          ended_at?: string | null
          id?: string
          mode?: string
          started_at?: string
          tax_file_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_ai_sessions_tax_file_id_fkey"
            columns: ["tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_assignments: {
        Row: {
          assigned_by: string
          assigned_to: string
          created_at: string
          id: string
          role: string
          tax_file_id: string
        }
        Insert: {
          assigned_by: string
          assigned_to: string
          created_at?: string
          id?: string
          role?: string
          tax_file_id: string
        }
        Update: {
          assigned_by?: string
          assigned_to?: string
          created_at?: string
          id?: string
          role?: string
          tax_file_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_assignments_tax_file_id_fkey"
            columns: ["tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_clients: {
        Row: {
          address_city: string | null
          address_country: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          dependents_count: number | null
          ein_encrypted: string | null
          email: string | null
          filing_status: string | null
          financial_contact_email: string | null
          financial_contact_name: string | null
          id: string
          legal_first_name: string | null
          legal_last_name: string | null
          notes: string | null
          officer_email: string | null
          officer_name: string | null
          organization_name: string | null
          organization_type: string | null
          phone: string | null
          preferred_language: string | null
          ssn_encrypted: string | null
          tax_user_type: Database["public"]["Enums"]["tax_user_type"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address_city?: string | null
          address_country?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          dependents_count?: number | null
          ein_encrypted?: string | null
          email?: string | null
          filing_status?: string | null
          financial_contact_email?: string | null
          financial_contact_name?: string | null
          id?: string
          legal_first_name?: string | null
          legal_last_name?: string | null
          notes?: string | null
          officer_email?: string | null
          officer_name?: string | null
          organization_name?: string | null
          organization_type?: string | null
          phone?: string | null
          preferred_language?: string | null
          ssn_encrypted?: string | null
          tax_user_type?: Database["public"]["Enums"]["tax_user_type"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address_city?: string | null
          address_country?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          dependents_count?: number | null
          ein_encrypted?: string | null
          email?: string | null
          filing_status?: string | null
          financial_contact_email?: string | null
          financial_contact_name?: string | null
          id?: string
          legal_first_name?: string | null
          legal_last_name?: string | null
          notes?: string | null
          officer_email?: string | null
          officer_name?: string | null
          organization_name?: string | null
          organization_type?: string | null
          phone?: string | null
          preferred_language?: string | null
          ssn_encrypted?: string | null
          tax_user_type?: Database["public"]["Enums"]["tax_user_type"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tax_document_analysis: {
        Row: {
          ai_model: string | null
          analysis_status: string
          confidence_score: number | null
          created_at: string
          detected_entity_name: string | null
          detected_form_type: string | null
          detected_identifier: string | null
          detected_owner_name: string | null
          detected_tax_year: number | null
          error_message: string | null
          extracted_summary: Json
          id: string
          tax_document_id: string
          updated_at: string
        }
        Insert: {
          ai_model?: string | null
          analysis_status?: string
          confidence_score?: number | null
          created_at?: string
          detected_entity_name?: string | null
          detected_form_type?: string | null
          detected_identifier?: string | null
          detected_owner_name?: string | null
          detected_tax_year?: number | null
          error_message?: string | null
          extracted_summary?: Json
          id?: string
          tax_document_id: string
          updated_at?: string
        }
        Update: {
          ai_model?: string | null
          analysis_status?: string
          confidence_score?: number | null
          created_at?: string
          detected_entity_name?: string | null
          detected_form_type?: string | null
          detected_identifier?: string | null
          detected_owner_name?: string | null
          detected_tax_year?: number | null
          error_message?: string | null
          extracted_summary?: Json
          id?: string
          tax_document_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_document_analysis_tax_document_id_fkey"
            columns: ["tax_document_id"]
            isOneToOne: true
            referencedRelation: "tax_file_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_document_extractions: {
        Row: {
          created_at: string
          detected_entity_name: string | null
          detected_entity_tin: string | null
          detected_tax_year: number | null
          document_id: string
          document_type: string | null
          extracted_fields: Json | null
          extraction_model: string | null
          extraction_status: string | null
          id: string
          key_amounts: Json | null
          mapped_count: number | null
          target_form_code: string | null
          target_section_key: string | null
          tax_file_id: string
          unmapped_count: number | null
          warnings: Json | null
        }
        Insert: {
          created_at?: string
          detected_entity_name?: string | null
          detected_entity_tin?: string | null
          detected_tax_year?: number | null
          document_id: string
          document_type?: string | null
          extracted_fields?: Json | null
          extraction_model?: string | null
          extraction_status?: string | null
          id?: string
          key_amounts?: Json | null
          mapped_count?: number | null
          target_form_code?: string | null
          target_section_key?: string | null
          tax_file_id: string
          unmapped_count?: number | null
          warnings?: Json | null
        }
        Update: {
          created_at?: string
          detected_entity_name?: string | null
          detected_entity_tin?: string | null
          detected_tax_year?: number | null
          document_id?: string
          document_type?: string | null
          extracted_fields?: Json | null
          extraction_model?: string | null
          extraction_status?: string | null
          id?: string
          key_amounts?: Json | null
          mapped_count?: number | null
          target_form_code?: string | null
          target_section_key?: string | null
          tax_file_id?: string
          unmapped_count?: number | null
          warnings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_document_extractions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "tax_file_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_document_extractions_tax_file_id_fkey"
            columns: ["tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_document_type_registry: {
        Row: {
          applicable_profile_types: string[]
          category: string
          code: string
          created_at: string
          description: string | null
          display_name: string
          feeds_form_codes: string[]
          is_active: boolean
        }
        Insert: {
          applicable_profile_types?: string[]
          category: string
          code: string
          created_at?: string
          description?: string | null
          display_name: string
          feeds_form_codes?: string[]
          is_active?: boolean
        }
        Update: {
          applicable_profile_types?: string[]
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          display_name?: string
          feeds_form_codes?: string[]
          is_active?: boolean
        }
        Relationships: []
      }
      tax_documents: {
        Row: {
          category: string
          created_at: string
          extracted_data: Json | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          filing_id: string | null
          id: string
          name: string
          status: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          extracted_data?: Json | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          filing_id?: string | null
          id?: string
          name: string
          status?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          extracted_data?: Json | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          filing_id?: string | null
          id?: string
          name?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_documents_filing_id_fkey"
            columns: ["filing_id"]
            isOneToOne: false
            referencedRelation: "tax_filings"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_exports: {
        Row: {
          created_at: string
          created_by: string | null
          error_message: string | null
          export_status: string
          export_type: string
          file_path: string | null
          file_size_bytes: number | null
          id: string
          included_documents: Json
          included_forms: Json
          tax_file_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          export_status?: string
          export_type: string
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          included_documents?: Json
          included_forms?: Json
          tax_file_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          export_status?: string
          export_type?: string
          file_path?: string | null
          file_size_bytes?: number | null
          id?: string
          included_documents?: Json
          included_forms?: Json
          tax_file_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_exports_tax_file_id_fkey"
            columns: ["tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_extraction_field_mappings: {
        Row: {
          ai_value: string | null
          confidence: number | null
          created_at: string
          decided_at: string | null
          decided_by: string | null
          extraction_id: string
          final_value: string | null
          id: string
          source_field: string
          state: string
          target_field_key: string
          target_form_code: string
          tax_file_id: string
        }
        Insert: {
          ai_value?: string | null
          confidence?: number | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          extraction_id: string
          final_value?: string | null
          id?: string
          source_field: string
          state?: string
          target_field_key: string
          target_form_code: string
          tax_file_id: string
        }
        Update: {
          ai_value?: string | null
          confidence?: number | null
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          extraction_id?: string
          final_value?: string | null
          id?: string
          source_field?: string
          state?: string
          target_field_key?: string
          target_form_code?: string
          tax_file_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_extraction_field_mappings_extraction_id_fkey"
            columns: ["extraction_id"]
            isOneToOne: false
            referencedRelation: "tax_document_extractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_extraction_field_mappings_tax_file_id_fkey"
            columns: ["tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_extraction_review_actions: {
        Row: {
          action: string
          created_at: string
          field_key: string
          id: string
          new_value: string | null
          performed_by: string | null
          performed_role: string | null
          previous_value: string | null
          tax_field_value_id: string | null
          tax_file_id: string
        }
        Insert: {
          action: string
          created_at?: string
          field_key: string
          id?: string
          new_value?: string | null
          performed_by?: string | null
          performed_role?: string | null
          previous_value?: string | null
          tax_field_value_id?: string | null
          tax_file_id: string
        }
        Update: {
          action?: string
          created_at?: string
          field_key?: string
          id?: string
          new_value?: string | null
          performed_by?: string | null
          performed_role?: string | null
          previous_value?: string | null
          tax_field_value_id?: string | null
          tax_file_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_extraction_review_actions_tax_field_value_id_fkey"
            columns: ["tax_field_value_id"]
            isOneToOne: false
            referencedRelation: "tax_field_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_extraction_review_actions_tax_file_id_fkey"
            columns: ["tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_field_values: {
        Row: {
          ai_original_value: string | null
          confidence: number | null
          created_at: string
          field_key: string
          field_type: string | null
          id: string
          review_status: string
          section_key: string | null
          source: string
          source_document_id: string | null
          source_extraction_id: string | null
          tax_file_form_id: string | null
          tax_file_id: string
          updated_at: string
          value: string | null
          value_numeric: number | null
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          ai_original_value?: string | null
          confidence?: number | null
          created_at?: string
          field_key: string
          field_type?: string | null
          id?: string
          review_status?: string
          section_key?: string | null
          source?: string
          source_document_id?: string | null
          source_extraction_id?: string | null
          tax_file_form_id?: string | null
          tax_file_id: string
          updated_at?: string
          value?: string | null
          value_numeric?: number | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          ai_original_value?: string | null
          confidence?: number | null
          created_at?: string
          field_key?: string
          field_type?: string | null
          id?: string
          review_status?: string
          section_key?: string | null
          source?: string
          source_document_id?: string | null
          source_extraction_id?: string | null
          tax_file_form_id?: string | null
          tax_file_id?: string
          updated_at?: string
          value?: string | null
          value_numeric?: number | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_field_values_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "tax_file_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_field_values_source_extraction_id_fkey"
            columns: ["source_extraction_id"]
            isOneToOne: false
            referencedRelation: "tax_document_extractions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_field_values_tax_file_form_id_fkey"
            columns: ["tax_file_form_id"]
            isOneToOne: false
            referencedRelation: "tax_file_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_field_values_tax_file_id_fkey"
            columns: ["tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_file_documents: {
        Row: {
          ai_classification: string | null
          ai_confidence: number | null
          category: string
          created_at: string
          document_type: string | null
          extracted_data: Json | null
          extraction_status: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          name: string
          notes: string | null
          tax_file_id: string
          tax_year: number | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          ai_classification?: string | null
          ai_confidence?: number | null
          category?: string
          created_at?: string
          document_type?: string | null
          extracted_data?: Json | null
          extraction_status?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          name: string
          notes?: string | null
          tax_file_id: string
          tax_year?: number | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          ai_classification?: string | null
          ai_confidence?: number | null
          category?: string
          created_at?: string
          document_type?: string | null
          extracted_data?: Json | null
          extraction_status?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          name?: string
          notes?: string | null
          tax_file_id?: string
          tax_year?: number | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_file_documents_tax_file_id_fkey"
            columns: ["tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_file_forms: {
        Row: {
          ai_suggested: boolean
          completion_pct: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          export_status: string
          field_values: Json
          form_code: string
          form_role: string
          form_year: number | null
          id: string
          lifecycle: Database["public"]["Enums"]["tax_form_lifecycle"]
          locked: boolean
          locked_at: string | null
          mapping_status: string
          notes: string | null
          preview_status: string
          required_or_optional: string
          selection_source: string
          status: string
          tax_file_id: string
          updated_at: string
          user_confirmed: boolean
        }
        Insert: {
          ai_suggested?: boolean
          completion_pct?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          export_status?: string
          field_values?: Json
          form_code: string
          form_role?: string
          form_year?: number | null
          id?: string
          lifecycle?: Database["public"]["Enums"]["tax_form_lifecycle"]
          locked?: boolean
          locked_at?: string | null
          mapping_status?: string
          notes?: string | null
          preview_status?: string
          required_or_optional?: string
          selection_source?: string
          status?: string
          tax_file_id: string
          updated_at?: string
          user_confirmed?: boolean
        }
        Update: {
          ai_suggested?: boolean
          completion_pct?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          export_status?: string
          field_values?: Json
          form_code?: string
          form_role?: string
          form_year?: number | null
          id?: string
          lifecycle?: Database["public"]["Enums"]["tax_form_lifecycle"]
          locked?: boolean
          locked_at?: string | null
          mapping_status?: string
          notes?: string | null
          preview_status?: string
          required_or_optional?: string
          selection_source?: string
          status?: string
          tax_file_id?: string
          updated_at?: string
          user_confirmed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tax_file_forms_tax_file_id_fkey"
            columns: ["tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_files: {
        Row: {
          ai_recommended_filing_type: string | null
          assigned_to: string | null
          created_at: string
          deadline: string | null
          draft_return_data: Json | null
          exported_at: string | null
          extracted_data: Json | null
          field_values: Json | null
          filing_confirmed: boolean | null
          filing_confirmed_at: string | null
          filing_type: string
          finalized_at: string | null
          finalized_by: string | null
          financial_statement_data: Json | null
          id: string
          lock_status: string | null
          paid_at: string | null
          payment_amount_cents: number | null
          payment_status: string | null
          prior_year_tax_file_id: string | null
          readiness_score: number | null
          reviewer_id: string | null
          service_mode: Database["public"]["Enums"]["tax_service_mode"]
          source_documents_count: number | null
          status: Database["public"]["Enums"]["tax_file_status"]
          stripe_payment_id: string | null
          stripe_session_id: string | null
          tax_client_id: string
          tax_year: number
          updated_at: string
        }
        Insert: {
          ai_recommended_filing_type?: string | null
          assigned_to?: string | null
          created_at?: string
          deadline?: string | null
          draft_return_data?: Json | null
          exported_at?: string | null
          extracted_data?: Json | null
          field_values?: Json | null
          filing_confirmed?: boolean | null
          filing_confirmed_at?: string | null
          filing_type?: string
          finalized_at?: string | null
          finalized_by?: string | null
          financial_statement_data?: Json | null
          id?: string
          lock_status?: string | null
          paid_at?: string | null
          payment_amount_cents?: number | null
          payment_status?: string | null
          prior_year_tax_file_id?: string | null
          readiness_score?: number | null
          reviewer_id?: string | null
          service_mode?: Database["public"]["Enums"]["tax_service_mode"]
          source_documents_count?: number | null
          status?: Database["public"]["Enums"]["tax_file_status"]
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          tax_client_id: string
          tax_year?: number
          updated_at?: string
        }
        Update: {
          ai_recommended_filing_type?: string | null
          assigned_to?: string | null
          created_at?: string
          deadline?: string | null
          draft_return_data?: Json | null
          exported_at?: string | null
          extracted_data?: Json | null
          field_values?: Json | null
          filing_confirmed?: boolean | null
          filing_confirmed_at?: string | null
          filing_type?: string
          finalized_at?: string | null
          finalized_by?: string | null
          financial_statement_data?: Json | null
          id?: string
          lock_status?: string | null
          paid_at?: string | null
          payment_amount_cents?: number | null
          payment_status?: string | null
          prior_year_tax_file_id?: string | null
          readiness_score?: number | null
          reviewer_id?: string | null
          service_mode?: Database["public"]["Enums"]["tax_service_mode"]
          source_documents_count?: number | null
          status?: Database["public"]["Enums"]["tax_file_status"]
          stripe_payment_id?: string | null
          stripe_session_id?: string | null
          tax_client_id?: string
          tax_year?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_files_prior_year_tax_file_id_fkey"
            columns: ["prior_year_tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_files_tax_client_id_fkey"
            columns: ["tax_client_id"]
            isOneToOne: false
            referencedRelation: "tax_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_filing_recommendations: {
        Row: {
          ai_model: string | null
          alternative_paths: Json | null
          confidence_score: number | null
          confirmed_at: string | null
          confirmed_by: string | null
          confirmed_filing_type: string | null
          created_at: string
          detected_filing_type: string | null
          evidence_summary: Json | null
          id: string
          recommendation_text: string | null
          tax_file_id: string
          updated_at: string
          user_confirmed: boolean | null
        }
        Insert: {
          ai_model?: string | null
          alternative_paths?: Json | null
          confidence_score?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          confirmed_filing_type?: string | null
          created_at?: string
          detected_filing_type?: string | null
          evidence_summary?: Json | null
          id?: string
          recommendation_text?: string | null
          tax_file_id: string
          updated_at?: string
          user_confirmed?: boolean | null
        }
        Update: {
          ai_model?: string | null
          alternative_paths?: Json | null
          confidence_score?: number | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          confirmed_filing_type?: string | null
          created_at?: string
          detected_filing_type?: string | null
          evidence_summary?: Json | null
          id?: string
          recommendation_text?: string | null
          tax_file_id?: string
          updated_at?: string
          user_confirmed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_filing_recommendations_tax_file_id_fkey"
            columns: ["tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_filings: {
        Row: {
          created_at: string
          exported_at: string | null
          field_values: Json
          filing_type: string
          filing_year: string | null
          id: string
          intake_id: string | null
          progress: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exported_at?: string | null
          field_values?: Json
          filing_type: string
          filing_year?: string | null
          id?: string
          intake_id?: string | null
          progress?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exported_at?: string | null
          field_values?: Json
          filing_type?: string
          filing_year?: string | null
          id?: string
          intake_id?: string | null
          progress?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_filings_intake_id_fkey"
            columns: ["intake_id"]
            isOneToOne: false
            referencedRelation: "tax_intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_financial_statements: {
        Row: {
          created_at: string
          created_by: string | null
          export_status: string
          id: string
          source_method: string
          statement_data: Json
          statement_type: string
          statement_year: number
          status: string
          tax_file_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          export_status?: string
          id?: string
          source_method?: string
          statement_data?: Json
          statement_type: string
          statement_year: number
          status?: string
          tax_file_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          export_status?: string
          id?: string
          source_method?: string
          statement_data?: Json
          statement_type?: string
          statement_year?: number
          status?: string
          tax_file_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_financial_statements_tax_file_id_fkey"
            columns: ["tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_firm_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          firm_id: string
          id: string
          is_active: boolean
          member_user_id: string
          role: string
          tax_file_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          firm_id: string
          id?: string
          is_active?: boolean
          member_user_id: string
          role?: string
          tax_file_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          firm_id?: string
          id?: string
          is_active?: boolean
          member_user_id?: string
          role?: string
          tax_file_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_firm_assignments_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "tax_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_firm_assignments_tax_file_id_fkey"
            columns: ["tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_firm_clients: {
        Row: {
          added_by: string | null
          created_at: string
          firm_id: string
          id: string
          is_active: boolean
          tax_client_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          firm_id: string
          id?: string
          is_active?: boolean
          tax_client_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          firm_id?: string
          id?: string
          is_active?: boolean
          tax_client_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_firm_clients_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "tax_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_firm_clients_tax_client_id_fkey"
            columns: ["tax_client_id"]
            isOneToOne: false
            referencedRelation: "tax_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_firm_members: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          firm_id: string
          id: string
          invited_by: string | null
          is_active: boolean
          joined_at: string
          role: Database["public"]["Enums"]["tax_firm_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          firm_id: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["tax_firm_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          firm_id?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean
          joined_at?: string
          role?: Database["public"]["Enums"]["tax_firm_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_firm_members_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "tax_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_firms: {
        Row: {
          address_city: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          created_at: string
          created_by: string | null
          ein: string | null
          email: string | null
          id: string
          is_active: boolean
          legal_name: string | null
          name: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          created_at?: string
          created_by?: string | null
          ein?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          legal_name?: string | null
          name: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          created_at?: string
          created_by?: string | null
          ein?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          legal_name?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      tax_form_registry: {
        Row: {
          applicable_profile_types: string[]
          created_at: string
          description: string | null
          form_code: string
          form_name: string
          is_active: boolean
          required_schedules: Json
          requires_signature: boolean
          supports_ai_prefill: boolean
          supports_export: boolean
          supports_portal_filing: boolean
          years_supported: number[]
        }
        Insert: {
          applicable_profile_types?: string[]
          created_at?: string
          description?: string | null
          form_code: string
          form_name: string
          is_active?: boolean
          required_schedules?: Json
          requires_signature?: boolean
          supports_ai_prefill?: boolean
          supports_export?: boolean
          supports_portal_filing?: boolean
          years_supported?: number[]
        }
        Update: {
          applicable_profile_types?: string[]
          created_at?: string
          description?: string | null
          form_code?: string
          form_name?: string
          is_active?: boolean
          required_schedules?: Json
          requires_signature?: boolean
          supports_ai_prefill?: boolean
          supports_export?: boolean
          supports_portal_filing?: boolean
          years_supported?: number[]
        }
        Relationships: []
      }
      tax_form_sections: {
        Row: {
          completion_percent: number
          created_at: string
          id: string
          last_saved_at: string | null
          missing_items_count: number
          section_key: string
          section_title: string
          status: string
          tax_file_form_id: string
          updated_at: string
        }
        Insert: {
          completion_percent?: number
          created_at?: string
          id?: string
          last_saved_at?: string | null
          missing_items_count?: number
          section_key: string
          section_title: string
          status?: string
          tax_file_form_id: string
          updated_at?: string
        }
        Update: {
          completion_percent?: number
          created_at?: string
          id?: string
          last_saved_at?: string | null
          missing_items_count?: number
          section_key?: string
          section_title?: string
          status?: string
          tax_file_form_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_form_sections_tax_file_form_id_fkey"
            columns: ["tax_file_form_id"]
            isOneToOne: false
            referencedRelation: "tax_file_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_intakes: {
        Row: {
          answers: Json
          created_at: string
          id: string
          intake_type: string
          recommended_form: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          id?: string
          intake_type?: string
          recommended_form?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          id?: string
          intake_type?: string
          recommended_form?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tax_lifecycle_events: {
        Row: {
          actor_role: string | null
          actor_user_id: string | null
          created_at: string
          event_type: string
          from_status: string | null
          id: string
          metadata: Json | null
          reason: string | null
          tax_file_id: string
          to_status: string | null
        }
        Insert: {
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          tax_file_id: string
          to_status?: string | null
        }
        Update: {
          actor_role?: string | null
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          from_status?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          tax_file_id?: string
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_lifecycle_events_tax_file_id_fkey"
            columns: ["tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          read: boolean | null
          sender_id: string | null
          sender_name: string
          sender_role: string
          tax_file_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          read?: boolean | null
          sender_id?: string | null
          sender_name?: string
          sender_role?: string
          tax_file_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          read?: boolean | null
          sender_id?: string | null
          sender_name?: string
          sender_role?: string
          tax_file_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_messages_tax_file_id_fkey"
            columns: ["tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          paid_at: string | null
          refunded_at: string | null
          service_code: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          tax_file_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          paid_at?: string | null
          refunded_at?: string | null
          service_code: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tax_file_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          paid_at?: string | null
          refunded_at?: string | null
          service_code?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tax_file_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_payments_tax_file_id_fkey"
            columns: ["tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_return_history: {
        Row: {
          addresses: Json | null
          carryforward_data: Json | null
          created_at: string
          filing_type: string
          id: string
          key_values: Json | null
          officers: Json | null
          review_notes: string | null
          source_tax_file_id: string | null
          tax_client_id: string
          tax_year: number
          updated_at: string
        }
        Insert: {
          addresses?: Json | null
          carryforward_data?: Json | null
          created_at?: string
          filing_type: string
          id?: string
          key_values?: Json | null
          officers?: Json | null
          review_notes?: string | null
          source_tax_file_id?: string | null
          tax_client_id: string
          tax_year: number
          updated_at?: string
        }
        Update: {
          addresses?: Json | null
          carryforward_data?: Json | null
          created_at?: string
          filing_type?: string
          id?: string
          key_values?: Json | null
          officers?: Json | null
          review_notes?: string | null
          source_tax_file_id?: string | null
          tax_client_id?: string
          tax_year?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_return_history_source_tax_file_id_fkey"
            columns: ["source_tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_return_history_tax_client_id_fkey"
            columns: ["tax_client_id"]
            isOneToOne: false
            referencedRelation: "tax_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_review_issues: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          field_key: string | null
          id: string
          issue_type: string
          message: string
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          suggested_fix: string | null
          tax_file_form_id: string | null
          tax_file_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          field_key?: string | null
          id?: string
          issue_type: string
          message: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          suggested_fix?: string | null
          tax_file_form_id?: string | null
          tax_file_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          field_key?: string | null
          id?: string
          issue_type?: string
          message?: string
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          suggested_fix?: string | null
          tax_file_form_id?: string | null
          tax_file_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_review_issues_tax_file_form_id_fkey"
            columns: ["tax_file_form_id"]
            isOneToOne: false
            referencedRelation: "tax_file_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_review_issues_tax_file_id_fkey"
            columns: ["tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_setup_requests: {
        Row: {
          created_at: string
          ein_needed: boolean | null
          entity_type: Database["public"]["Enums"]["entity_type"] | null
          formation_intake_id: string | null
          id: string
          notes: string | null
          payroll_needed: boolean | null
          status: string
          tax_classification: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ein_needed?: boolean | null
          entity_type?: Database["public"]["Enums"]["entity_type"] | null
          formation_intake_id?: string | null
          id?: string
          notes?: string | null
          payroll_needed?: boolean | null
          status?: string
          tax_classification?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ein_needed?: boolean | null
          entity_type?: Database["public"]["Enums"]["entity_type"] | null
          formation_intake_id?: string | null
          id?: string
          notes?: string | null
          payroll_needed?: boolean | null
          status?: string
          tax_classification?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_setup_requests_formation_intake_id_fkey"
            columns: ["formation_intake_id"]
            isOneToOne: false
            referencedRelation: "formation_intakes"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_spreadsheet_mappings: {
        Row: {
          category_mappings: Json | null
          column_mappings: Json | null
          created_at: string
          id: string
          last_used_at: string | null
          name: string
          source_type: string | null
          tax_client_id: string
          updated_at: string
        }
        Insert: {
          category_mappings?: Json | null
          column_mappings?: Json | null
          created_at?: string
          id?: string
          last_used_at?: string | null
          name?: string
          source_type?: string | null
          tax_client_id: string
          updated_at?: string
        }
        Update: {
          category_mappings?: Json | null
          column_mappings?: Json | null
          created_at?: string
          id?: string
          last_used_at?: string | null
          name?: string
          source_type?: string | null
          tax_client_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_spreadsheet_mappings_tax_client_id_fkey"
            columns: ["tax_client_id"]
            isOneToOne: false
            referencedRelation: "tax_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_staff: {
        Row: {
          created_at: string
          display_name: string
          email: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["tax_staff_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          email?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["tax_staff_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["tax_staff_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tax_staff_notes: {
        Row: {
          author_id: string
          author_name: string
          content: string
          created_at: string
          id: string
          is_flagged: boolean | null
          is_urgent: boolean | null
          note_type: string | null
          tax_file_id: string | null
        }
        Insert: {
          author_id: string
          author_name?: string
          content: string
          created_at?: string
          id?: string
          is_flagged?: boolean | null
          is_urgent?: boolean | null
          note_type?: string | null
          tax_file_id?: string | null
        }
        Update: {
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          is_flagged?: boolean | null
          is_urgent?: boolean | null
          note_type?: string | null
          tax_file_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_staff_notes_tax_file_id_fkey"
            columns: ["tax_file_id"]
            isOneToOne: false
            referencedRelation: "tax_files"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_year_registry: {
        Row: {
          created_at: string
          extension_deadline: string | null
          filing_deadline: string | null
          is_active: boolean
          is_default: boolean
          notes: string | null
          tax_year: number
        }
        Insert: {
          created_at?: string
          extension_deadline?: string | null
          filing_deadline?: string | null
          is_active?: boolean
          is_default?: boolean
          notes?: string | null
          tax_year: number
        }
        Update: {
          created_at?: string
          extension_deadline?: string | null
          filing_deadline?: string | null
          is_active?: boolean
          is_default?: boolean
          notes?: string | null
          tax_year?: number
        }
        Relationships: []
      }
      teacher_lesson_materials: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          lesson_id: string
          material_type: Database["public"]["Enums"]["material_type"]
          notes: string | null
          title: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          lesson_id: string
          material_type: Database["public"]["Enums"]["material_type"]
          notes?: string | null
          title: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          lesson_id?: string
          material_type?: Database["public"]["Enums"]["material_type"]
          notes?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_lesson_materials_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "english_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      template_field_mappings: {
        Row: {
          created_at: string
          field_type: string
          id: string
          internal_data_path: string
          is_required: boolean
          page_number: number | null
          pdf_field_name: string
          template_id: string
          transform_rule: string | null
        }
        Insert: {
          created_at?: string
          field_type?: string
          id?: string
          internal_data_path: string
          is_required?: boolean
          page_number?: number | null
          pdf_field_name: string
          template_id: string
          transform_rule?: string | null
        }
        Update: {
          created_at?: string
          field_type?: string
          id?: string
          internal_data_path?: string
          is_required?: boolean
          page_number?: number | null
          pdf_field_name?: string
          template_id?: string
          transform_rule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "template_field_mappings_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          source_language: string | null
          target_language: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          source_language?: string | null
          target_language?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          source_language?: string | null
          target_language?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      travels: {
        Row: {
          created_at: string
          departure_date: string | null
          destination_country: string
          id: string
          person_id: string
          purpose: string | null
          return_date: string | null
        }
        Insert: {
          created_at?: string
          departure_date?: string | null
          destination_country: string
          id?: string
          person_id: string
          purpose?: string | null
          return_date?: string | null
        }
        Update: {
          created_at?: string
          departure_date?: string | null
          destination_country?: string
          id?: string
          person_id?: string
          purpose?: string | null
          return_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "travels_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "travels_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "persons_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_referral_feature_rules: {
        Row: {
          created_at: string
          feature_key: string
          id: string
          is_enabled: boolean
          trial_referral_id: string
          usage_limit: number | null
        }
        Insert: {
          created_at?: string
          feature_key: string
          id?: string
          is_enabled?: boolean
          trial_referral_id: string
          usage_limit?: number | null
        }
        Update: {
          created_at?: string
          feature_key?: string
          id?: string
          is_enabled?: boolean
          trial_referral_id?: string
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_referral_feature_rules_trial_referral_id_fkey"
            columns: ["trial_referral_id"]
            isOneToOne: false
            referencedRelation: "trial_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_referral_redemptions: {
        Row: {
          approved_by: string | null
          created_at: string
          expires_at: string
          id: string
          organization_id: string | null
          redeemed_at: string
          request_info: Json | null
          status: Database["public"]["Enums"]["referral_redemption_status"]
          trial_referral_id: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          expires_at: string
          id?: string
          organization_id?: string | null
          redeemed_at?: string
          request_info?: Json | null
          status?: Database["public"]["Enums"]["referral_redemption_status"]
          trial_referral_id: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          organization_id?: string | null
          redeemed_at?: string
          request_info?: Json | null
          status?: Database["public"]["Enums"]["referral_redemption_status"]
          trial_referral_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_referral_redemptions_trial_referral_id_fkey"
            columns: ["trial_referral_id"]
            isOneToOne: false
            referencedRelation: "trial_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      trial_referrals: {
        Row: {
          activation_mode: Database["public"]["Enums"]["referral_activation_mode"]
          auto_expire: boolean
          code: string
          created_at: string
          created_by: string
          duration_days: number
          end_at: string | null
          id: string
          is_active: boolean
          max_orgs: number | null
          max_users_per_org: number | null
          max_uses: number | null
          name: string
          notes: string | null
          referral_type: Database["public"]["Enums"]["referral_target_type"]
          start_at: string | null
          updated_at: string
        }
        Insert: {
          activation_mode?: Database["public"]["Enums"]["referral_activation_mode"]
          auto_expire?: boolean
          code: string
          created_at?: string
          created_by: string
          duration_days?: number
          end_at?: string | null
          id?: string
          is_active?: boolean
          max_orgs?: number | null
          max_users_per_org?: number | null
          max_uses?: number | null
          name: string
          notes?: string | null
          referral_type?: Database["public"]["Enums"]["referral_target_type"]
          start_at?: string | null
          updated_at?: string
        }
        Update: {
          activation_mode?: Database["public"]["Enums"]["referral_activation_mode"]
          auto_expire?: boolean
          code?: string
          created_at?: string
          created_by?: string
          duration_days?: number
          end_at?: string | null
          id?: string
          is_active?: boolean
          max_orgs?: number | null
          max_users_per_org?: number | null
          max_uses?: number | null
          name?: string
          notes?: string | null
          referral_type?: Database["public"]["Enums"]["referral_target_type"]
          start_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      us_states: {
        Row: {
          code: string
          filing_office_name: string | null
          filing_office_url: string | null
          name: string
          notes: string | null
        }
        Insert: {
          code: string
          filing_office_name?: string | null
          filing_office_url?: string | null
          name: string
          notes?: string | null
        }
        Update: {
          code?: string
          filing_office_name?: string | null
          filing_office_url?: string | null
          name?: string
          notes?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vapid_keys: {
        Row: {
          created_at: string
          id: string
          private_key: string
          public_key: string
        }
        Insert: {
          created_at?: string
          id?: string
          private_key: string
          public_key: string
        }
        Update: {
          created_at?: string
          id?: string
          private_key?: string
          public_key?: string
        }
        Relationships: []
      }
    }
    Views: {
      persons_safe: {
        Row: {
          alien_number: string | null
          case_id: string | null
          city_of_birth: string | null
          country_of_birth: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          first_name: string | null
          gender: string | null
          id: string | null
          last_name: string | null
          marital_status: string | null
          middle_name: string | null
          nationality: string | null
          other_names: string[] | null
          passport_country: string | null
          passport_expiry: string | null
          passport_number: string | null
          phone: string | null
          role: Database["public"]["Enums"]["person_role"] | null
          ssn: string | null
          updated_at: string | null
        }
        Insert: {
          alien_number?: string | null
          case_id?: string | null
          city_of_birth?: string | null
          country_of_birth?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string | null
          last_name?: string | null
          marital_status?: string | null
          middle_name?: string | null
          nationality?: string | null
          other_names?: string[] | null
          passport_country?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["person_role"] | null
          ssn?: never
          updated_at?: string | null
        }
        Update: {
          alien_number?: string | null
          case_id?: string | null
          city_of_birth?: string | null
          country_of_birth?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string | null
          last_name?: string | null
          marital_status?: string | null
          middle_name?: string | null
          nationality?: string | null
          other_names?: string[] | null
          passport_country?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["person_role"] | null
          ssn?: never
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "persons_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      success_map_entries_public: {
        Row: {
          case_type: string | null
          created_at: string | null
          id: string | null
          is_approved: boolean | null
          latitude: number | null
          location_label: string | null
          longitude: number | null
          milestone: string | null
          timeline_months: number | null
        }
        Insert: {
          case_type?: string | null
          created_at?: string | null
          id?: string | null
          is_approved?: boolean | null
          latitude?: number | null
          location_label?: string | null
          longitude?: number | null
          milestone?: string | null
          timeline_months?: number | null
        }
        Update: {
          case_type?: string | null
          created_at?: string | null
          id?: string | null
          is_approved?: boolean | null
          latitude?: number | null
          location_label?: string | null
          longitude?: number | null
          milestone?: string | null
          timeline_months?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_attorney_invitation: {
        Args: { _invitation_id: string }
        Returns: undefined
      }
      can_access_tax_file: {
        Args: { _tax_file_id: string; _user_id: string }
        Returns: boolean
      }
      get_firm_role: {
        Args: { _firm_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["firm_role"]
      }
      get_institution_role: {
        Args: { _institution_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["institutional_role"]
      }
      get_person_ssn: { Args: { _person_id: string }; Returns: string }
      get_tax_firm_role: {
        Args: { _firm_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["tax_firm_role"]
      }
      get_tax_staff_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["tax_staff_role"]
      }
      get_user_firm_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_client_case: { Args: { _user_id: string }; Returns: Json }
      is_case_participant: {
        Args: { _case_id: string; _user_id: string }
        Returns: boolean
      }
      is_firm_member: {
        Args: { _firm_id: string; _user_id: string }
        Returns: boolean
      }
      is_institution_member: {
        Args: { _institution_id: string; _user_id: string }
        Returns: boolean
      }
      is_tax_firm_member: {
        Args: { _firm_id: string; _user_id: string }
        Returns: boolean
      }
      is_tax_staff: { Args: { _user_id: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          _action_type: string
          _after_state?: Json
          _before_state?: Json
          _case_id?: string
          _error_details?: string
          _human_label: string
          _metadata?: Json
          _module: string
          _record_id?: string
          _success?: boolean
          _target_id?: string
          _target_type?: string
          _user_id: string
          _user_role: string
        }
        Returns: string
      }
      user_assigned_to_tax_file: {
        Args: { _tax_file_id: string; _user_id: string }
        Returns: boolean
      }
      user_services_tax_client: {
        Args: { _tax_client_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      affiliate_payout_model: "export_only" | "subscription_only" | "hybrid"
      app_role:
        | "admin"
        | "practitioner"
        | "attorney"
        | "paralegal"
        | "translator"
        | "client"
      application_status:
        | "not_started"
        | "started"
        | "in_progress"
        | "completed"
        | "ready_for_review"
        | "submitted"
        | "approved"
        | "denied"
      case_priority: "low" | "medium" | "high" | "urgent"
      case_status:
        | "draft"
        | "in_progress"
        | "waiting_client"
        | "ready_for_review"
        | "submitted"
        | "rfe_issued"
        | "rfe_response_sent"
        | "approved"
        | "denied"
        | "closed"
      class_type: "group" | "private"
      collaborator_type: "attorney" | "organization" | "ar_doj"
      commission_status:
        | "pending"
        | "approved"
        | "paid"
        | "held"
        | "disputed"
        | "cancelled"
      compliance_status: "pending" | "approved" | "rejected" | "suspended"
      consistency_severity: "high" | "medium" | "low"
      doc_status: "pending" | "approved" | "rejected"
      english_level: "beginner" | "basic" | "intermediate" | "advanced"
      enrollment_status: "enrolled" | "completed" | "dropped"
      entity_type:
        | "llc"
        | "corporation"
        | "nonprofit"
        | "sole_proprietorship"
        | "partnership"
        | "dba"
      evidence_quality: "complete" | "missing" | "low_quality"
      firm_role:
        | "firm_admin"
        | "attorney"
        | "paralegal"
        | "intake_staff"
        | "reviewer"
        | "billing"
        | "readonly"
      form_export_status:
        | "draft"
        | "needs_client_fix"
        | "needs_review"
        | "ready_for_export"
        | "exported"
      formation_status:
        | "started"
        | "in_progress"
        | "completed"
        | "submitted"
        | "filed"
      handoff_type:
        | "review_draft"
        | "complete_filing"
        | "consultation"
        | "nonprofit_review"
        | "eb5_review"
        | "tax_setup"
      id_document_type:
        | "passport"
        | "drivers_license"
        | "state_id"
        | "government_id"
        | "other"
      id_verification_status: "pending" | "approved" | "rejected" | "expired"
      institution_status: "active" | "pending" | "suspended" | "inactive"
      institution_type:
        | "government_agency"
        | "nonprofit"
        | "city_office"
        | "state_office"
        | "federal_program"
        | "community_org"
        | "accelerator"
        | "education"
      institutional_role:
        | "super_admin"
        | "government_admin"
        | "organization_admin"
        | "program_manager"
        | "caseworker"
        | "support_staff"
        | "reporting_only"
      intake_status:
        | "new"
        | "reviewing"
        | "accepted"
        | "assigned"
        | "declined"
        | "consultation_scheduled"
        | "needs_info"
      invitation_status:
        | "pending"
        | "accepted"
        | "declined"
        | "revoked"
        | "expired"
      lesson_progress_status: "not_started" | "in_progress" | "completed"
      lesson_type: "live" | "self_paced" | "mixed"
      listing_category:
        | "startup_investor"
        | "expansion_capital"
        | "real_estate"
        | "immigrant_business"
        | "nonprofit_partnership"
        | "franchise_acquisition"
        | "affordable_housing"
        | "other"
      listing_status:
        | "draft"
        | "pending_review"
        | "published"
        | "rejected"
        | "expired"
        | "suspended"
      marketplace_mode: "public_listing" | "capital_raising_referral"
      material_type:
        | "slide_deck"
        | "worksheet"
        | "audio"
        | "script"
        | "vocabulary_list"
      message_sender_role: "practitioner" | "client" | "system" | "attorney"
      network_listing_category:
        | "immigration_opportunity"
        | "employment_sponsorship"
        | "business_opportunity"
        | "nonprofit_program"
        | "education_scholarship"
        | "housing_relocation"
        | "professional_service"
      network_listing_status:
        | "draft"
        | "pending_review"
        | "published"
        | "rejected"
        | "expired"
      participant_status:
        | "onboarding"
        | "active"
        | "waiting_on_documents"
        | "ready_for_review"
        | "referred_out"
        | "completed"
        | "inactive"
      pathway_category:
        | "FAMILY"
        | "WORK"
        | "HUMANITARIAN"
        | "STUDY"
        | "CITIZENSHIP"
        | "VISIT"
        | "GREEN_CARD"
      pathway_result_status:
        | "STRONG"
        | "POSSIBLE"
        | "NOT_ELIGIBLE"
        | "NEEDS_INFO"
      pathway_risk_level: "LOW" | "MEDIUM" | "HIGH"
      pathway_rule_type:
        | "ELIGIBILITY"
        | "DISQUALIFIER"
        | "SCORE"
        | "EVIDENCE"
        | "ROADMAP"
      pathway_session_status: "in_progress" | "complete" | "abandoned"
      payment_status: "paid" | "pending" | "overdue" | "refunded"
      payout_status: "pending" | "approved" | "paid" | "held" | "disputed"
      person_role:
        | "petitioner"
        | "beneficiary"
        | "sponsor"
        | "derivative"
        | "preparer"
        | "interpreter"
      professional_type:
        | "immigration_attorney"
        | "accredited_representative"
        | "tax_professional"
        | "nonprofit_advisor"
        | "business_consultant"
        | "translator"
        | "relocation_advisor"
      program_type:
        | "citizenship"
        | "legal_orientation"
        | "integration"
        | "entrepreneurship"
        | "housing"
        | "education"
        | "health"
        | "general"
      question_type:
        | "multiple_choice"
        | "true_false"
        | "listening"
        | "short_answer"
      referral_activation_mode: "instant" | "approval_required" | "invite_only"
      referral_redemption_status:
        | "pending"
        | "active"
        | "expired"
        | "revoked"
        | "denied"
      referral_target_type:
        | "customer"
        | "attorney"
        | "accredited_representative"
        | "organization"
        | "general_public"
      revenue_type: "export" | "subscription" | "addon"
      section_type:
        | "warmup"
        | "vocabulary"
        | "grammar"
        | "dialogue"
        | "speaking_practice"
        | "listening"
        | "quiz"
        | "homework"
        | "teacher_notes"
      signature_method: "draw" | "type" | "upload"
      submission_lock_status:
        | "draft"
        | "in_progress"
        | "under_review"
        | "ready_for_finalization"
        | "finalized"
        | "reopened"
      submission_type: "none" | "text" | "voice" | "worksheet_upload"
      tax_file_status:
        | "new_intake"
        | "awaiting_documents"
        | "documents_uploaded"
        | "extraction_complete"
        | "forms_selected"
        | "draft_in_progress"
        | "awaiting_review"
        | "awaiting_client_response"
        | "error_review"
        | "ready_for_payment"
        | "paid_ready_export"
        | "completed"
        | "on_hold"
        | "ai_analyzing"
        | "awaiting_verification"
        | "profile_confirmed"
        | "ready_for_preview"
        | "ready_for_export"
        | "exported"
        | "portal_filing_pending"
        | "portal_filed"
        | "archived"
      tax_firm_role:
        | "owner_admin"
        | "partner_cpa"
        | "manager"
        | "preparer"
        | "reviewer"
        | "intake"
        | "billing"
        | "readonly"
      tax_form_lifecycle:
        | "not_started"
        | "in_progress"
        | "awaiting_user_verification"
        | "awaiting_professional_review"
        | "review_required"
        | "ready_for_preview"
        | "ready_for_export"
        | "exported"
        | "filed"
        | "blocked"
      tax_service_mode:
        | "self_prepare"
        | "guided_self_service"
        | "ccgvs_assisted"
        | "cpa_review"
        | "full_service"
      tax_staff_role:
        | "owner_admin"
        | "tax_preparer"
        | "accountant"
        | "cpa_reviewer"
        | "intake_staff"
        | "document_reviewer"
        | "readonly_staff"
      tax_user_type:
        | "individual"
        | "nonprofit"
        | "small_business"
        | "accountant_cpa"
        | "internal_client"
      timeline_event_type: "system" | "user" | "uscis" | "milestone"
      workflow_status:
        | "draft"
        | "client_completed"
        | "ready_for_review"
        | "returned_for_fixes"
        | "approved_to_submit"
        | "submitted"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      affiliate_payout_model: ["export_only", "subscription_only", "hybrid"],
      app_role: [
        "admin",
        "practitioner",
        "attorney",
        "paralegal",
        "translator",
        "client",
      ],
      application_status: [
        "not_started",
        "started",
        "in_progress",
        "completed",
        "ready_for_review",
        "submitted",
        "approved",
        "denied",
      ],
      case_priority: ["low", "medium", "high", "urgent"],
      case_status: [
        "draft",
        "in_progress",
        "waiting_client",
        "ready_for_review",
        "submitted",
        "rfe_issued",
        "rfe_response_sent",
        "approved",
        "denied",
        "closed",
      ],
      class_type: ["group", "private"],
      collaborator_type: ["attorney", "organization", "ar_doj"],
      commission_status: [
        "pending",
        "approved",
        "paid",
        "held",
        "disputed",
        "cancelled",
      ],
      compliance_status: ["pending", "approved", "rejected", "suspended"],
      consistency_severity: ["high", "medium", "low"],
      doc_status: ["pending", "approved", "rejected"],
      english_level: ["beginner", "basic", "intermediate", "advanced"],
      enrollment_status: ["enrolled", "completed", "dropped"],
      entity_type: [
        "llc",
        "corporation",
        "nonprofit",
        "sole_proprietorship",
        "partnership",
        "dba",
      ],
      evidence_quality: ["complete", "missing", "low_quality"],
      firm_role: [
        "firm_admin",
        "attorney",
        "paralegal",
        "intake_staff",
        "reviewer",
        "billing",
        "readonly",
      ],
      form_export_status: [
        "draft",
        "needs_client_fix",
        "needs_review",
        "ready_for_export",
        "exported",
      ],
      formation_status: [
        "started",
        "in_progress",
        "completed",
        "submitted",
        "filed",
      ],
      handoff_type: [
        "review_draft",
        "complete_filing",
        "consultation",
        "nonprofit_review",
        "eb5_review",
        "tax_setup",
      ],
      id_document_type: [
        "passport",
        "drivers_license",
        "state_id",
        "government_id",
        "other",
      ],
      id_verification_status: ["pending", "approved", "rejected", "expired"],
      institution_status: ["active", "pending", "suspended", "inactive"],
      institution_type: [
        "government_agency",
        "nonprofit",
        "city_office",
        "state_office",
        "federal_program",
        "community_org",
        "accelerator",
        "education",
      ],
      institutional_role: [
        "super_admin",
        "government_admin",
        "organization_admin",
        "program_manager",
        "caseworker",
        "support_staff",
        "reporting_only",
      ],
      intake_status: [
        "new",
        "reviewing",
        "accepted",
        "assigned",
        "declined",
        "consultation_scheduled",
        "needs_info",
      ],
      invitation_status: [
        "pending",
        "accepted",
        "declined",
        "revoked",
        "expired",
      ],
      lesson_progress_status: ["not_started", "in_progress", "completed"],
      lesson_type: ["live", "self_paced", "mixed"],
      listing_category: [
        "startup_investor",
        "expansion_capital",
        "real_estate",
        "immigrant_business",
        "nonprofit_partnership",
        "franchise_acquisition",
        "affordable_housing",
        "other",
      ],
      listing_status: [
        "draft",
        "pending_review",
        "published",
        "rejected",
        "expired",
        "suspended",
      ],
      marketplace_mode: ["public_listing", "capital_raising_referral"],
      material_type: [
        "slide_deck",
        "worksheet",
        "audio",
        "script",
        "vocabulary_list",
      ],
      message_sender_role: ["practitioner", "client", "system", "attorney"],
      network_listing_category: [
        "immigration_opportunity",
        "employment_sponsorship",
        "business_opportunity",
        "nonprofit_program",
        "education_scholarship",
        "housing_relocation",
        "professional_service",
      ],
      network_listing_status: [
        "draft",
        "pending_review",
        "published",
        "rejected",
        "expired",
      ],
      participant_status: [
        "onboarding",
        "active",
        "waiting_on_documents",
        "ready_for_review",
        "referred_out",
        "completed",
        "inactive",
      ],
      pathway_category: [
        "FAMILY",
        "WORK",
        "HUMANITARIAN",
        "STUDY",
        "CITIZENSHIP",
        "VISIT",
        "GREEN_CARD",
      ],
      pathway_result_status: [
        "STRONG",
        "POSSIBLE",
        "NOT_ELIGIBLE",
        "NEEDS_INFO",
      ],
      pathway_risk_level: ["LOW", "MEDIUM", "HIGH"],
      pathway_rule_type: [
        "ELIGIBILITY",
        "DISQUALIFIER",
        "SCORE",
        "EVIDENCE",
        "ROADMAP",
      ],
      pathway_session_status: ["in_progress", "complete", "abandoned"],
      payment_status: ["paid", "pending", "overdue", "refunded"],
      payout_status: ["pending", "approved", "paid", "held", "disputed"],
      person_role: [
        "petitioner",
        "beneficiary",
        "sponsor",
        "derivative",
        "preparer",
        "interpreter",
      ],
      professional_type: [
        "immigration_attorney",
        "accredited_representative",
        "tax_professional",
        "nonprofit_advisor",
        "business_consultant",
        "translator",
        "relocation_advisor",
      ],
      program_type: [
        "citizenship",
        "legal_orientation",
        "integration",
        "entrepreneurship",
        "housing",
        "education",
        "health",
        "general",
      ],
      question_type: [
        "multiple_choice",
        "true_false",
        "listening",
        "short_answer",
      ],
      referral_activation_mode: ["instant", "approval_required", "invite_only"],
      referral_redemption_status: [
        "pending",
        "active",
        "expired",
        "revoked",
        "denied",
      ],
      referral_target_type: [
        "customer",
        "attorney",
        "accredited_representative",
        "organization",
        "general_public",
      ],
      revenue_type: ["export", "subscription", "addon"],
      section_type: [
        "warmup",
        "vocabulary",
        "grammar",
        "dialogue",
        "speaking_practice",
        "listening",
        "quiz",
        "homework",
        "teacher_notes",
      ],
      signature_method: ["draw", "type", "upload"],
      submission_lock_status: [
        "draft",
        "in_progress",
        "under_review",
        "ready_for_finalization",
        "finalized",
        "reopened",
      ],
      submission_type: ["none", "text", "voice", "worksheet_upload"],
      tax_file_status: [
        "new_intake",
        "awaiting_documents",
        "documents_uploaded",
        "extraction_complete",
        "forms_selected",
        "draft_in_progress",
        "awaiting_review",
        "awaiting_client_response",
        "error_review",
        "ready_for_payment",
        "paid_ready_export",
        "completed",
        "on_hold",
        "ai_analyzing",
        "awaiting_verification",
        "profile_confirmed",
        "ready_for_preview",
        "ready_for_export",
        "exported",
        "portal_filing_pending",
        "portal_filed",
        "archived",
      ],
      tax_firm_role: [
        "owner_admin",
        "partner_cpa",
        "manager",
        "preparer",
        "reviewer",
        "intake",
        "billing",
        "readonly",
      ],
      tax_form_lifecycle: [
        "not_started",
        "in_progress",
        "awaiting_user_verification",
        "awaiting_professional_review",
        "review_required",
        "ready_for_preview",
        "ready_for_export",
        "exported",
        "filed",
        "blocked",
      ],
      tax_service_mode: [
        "self_prepare",
        "guided_self_service",
        "ccgvs_assisted",
        "cpa_review",
        "full_service",
      ],
      tax_staff_role: [
        "owner_admin",
        "tax_preparer",
        "accountant",
        "cpa_reviewer",
        "intake_staff",
        "document_reviewer",
        "readonly_staff",
      ],
      tax_user_type: [
        "individual",
        "nonprofit",
        "small_business",
        "accountant_cpa",
        "internal_client",
      ],
      timeline_event_type: ["system", "user", "uscis", "milestone"],
      workflow_status: [
        "draft",
        "client_completed",
        "ready_for_review",
        "returned_for_fixes",
        "approved_to_submit",
        "submitted",
      ],
    },
  },
} as const
